const {test}=require('node:test');
const assert=require('node:assert/strict');
const {buildSync}=require('esbuild');
const path=require('node:path');
const compile=file=>{const out=buildSync({entryPoints:[path.join(__dirname,'../frontend/src/lib',file)],bundle:true,platform:'node',format:'cjs',write:false});const m={exports:{}};new Function('require','module','exports',out.outputFiles[0].text)(require,m,m.exports);return m.exports;};
const compileCombined=()=>{const out=buildSync({stdin:{contents:"export * from './portfolio-simulation.ts';export {registerQuantVariance,quantModel} from './portfolio-quant-adapter.ts';",resolveDir:path.join(__dirname,'../frontend/src/lib'),loader:'ts'},bundle:true,platform:'node',format:'cjs',write:false});const m={exports:{}};new Function('require','module','exports',out.outputFiles[0].text)(require,m,m.exports);return m.exports;};
const engine=compile('portfolio-engine.ts'),data=compile('portfolio.ts'),sim=compileCombined(),adapter=sim;
// Fork nạp dữ liệu thật qua loadPortfolioData; test dùng fixture tổng hợp xác định từ assetDefinitions.
const OBSERVATIONS=60;
const fixtureMeta={FPT:{name:'FPT',sector:'Công nghệ',price:120000},VCB:{name:'Vietcombank',sector:'Ngân hàng',price:90000},HPG:{name:'Hòa Phát',sector:'Thép',price:27000},MBB:{name:'MB Bank',sector:'Ngân hàng',price:24000},SSI:{name:'SSI',sector:'Chứng khoán',price:35000},VNM:{name:'Vinamilk',sector:'Tiêu dùng',price:65000}};
const seededReturns=(seed,vol)=>{let s=seed;const next=()=>{s=(s*1103515245+12345)%2147483648;return s/2147483648;};return Array.from({length:OBSERVATIONS},()=>(next()-0.5)*2*vol);};
const assets=data.assetDefinitions.map((def,i)=>({...def,...fixtureMeta[def.symbol],returns:seededReturns(1234+i*777,0.012+def.beta*0.004)}));
for(const a of assets){const mean=a.returns.reduce((s,v)=>s+v,0)/a.returns.length;adapter.registerQuantVariance(a.symbol,a.returns.reduce((s,v)=>s+(v-mean)**2,0)/(a.returns.length-1));}
const samples=[
  {name:'Mẫu 1',portfolio:{cash:50000000,positions:[{symbol:'FPT',quantity:1000,cost:100000},{symbol:'VCB',quantity:2000,cost:80000},{symbol:'HPG',quantity:3000,cost:25000}]}},
  {name:'Mẫu 2',portfolio:{cash:20000000,positions:[{symbol:'MBB',quantity:4000,cost:22000},{symbol:'SSI',quantity:1500,cost:32000}]}},
  {name:'Mẫu 3',portfolio:{cash:0,positions:[{symbol:'VNM',quantity:1000,cost:60000},{symbol:'FPT',quantity:500,cost:110000},{symbol:'VCB',quantity:1000,cost:85000},{symbol:'HPG',quantity:2000,cost:26000},{symbol:'MBB',quantity:2000,cost:23000},{symbol:'SSI',quantity:1000,cost:33000}]}},
];
const near=(a,b,t=1e-8)=>assert.ok(Math.abs(a-b)<=t,`${a} ≠ ${b}`);

test('Danh mục dùng nến chung đồng bộ, đủ model và giá VND',()=>{
  for(const a of assets){assert.equal(a.returns.length,OBSERVATIONS);assert.ok(a.price>1000);assert.ok(a.returns.every(Number.isFinite));assert.ok(adapter.quantModel(a.symbol).variance>0);}
  assert.equal(samples.length,3);
});
test('Covariance dùng trung bình mẫu; kiểm tra bằng chuỗi tính tay',()=>{
  const c=engine.covariance([[1,2,3],[-1,-2,-3]]);near(c[0][0],1);near(c[0][1],-1);near(c[1][1],1);
  assert.throws(()=>engine.covariance([[1],[2]]));assert.throws(()=>engine.covariance([[1,2],[2,3,4]]));
});
test('Tổng tài sản và P&L khớp phép tính độc lập; risk contribution cộng đúng',()=>{
  for(const {portfolio} of samples){const r=engine.portfolioRisk(portfolio,assets);near(r.total,portfolio.cash+portfolio.positions.reduce((s,p)=>s+p.quantity*assets.find(a=>a.symbol===p.symbol).price,0));near(r.profit,r.equity-r.invested);near(r.holdings.reduce((s,h)=>s+h.weight,0)+r.cashWeight,1);near(r.holdings.reduce((s,h)=>s+h.riskContribution,0),1);assert.ok(r.volatility>0);}
});
test('Tiền mặt giảm volatility tuyến tính, không làm đổi P&L cổ phiếu',()=>{
  const a=engine.portfolioRisk({cash:0,positions:samples[0].portfolio.positions},assets),b=engine.portfolioRisk({cash:a.total,positions:samples[0].portfolio.positions},assets);
  near(b.volatility,a.volatility/2);near(b.beta,a.beta/2);near(a.profit,b.profit);
});
test('Đóng góp phòng vệ có thể âm, không bị cắt về 0 trong engine',()=>{
  const a=[{symbol:'A',sector:'A',price:1,beta:1,returns:[-.02,0,.02],color:''},{symbol:'B',sector:'B',price:1,beta:1,returns:[.02,0,-.02],color:''}];
  const r=engine.portfolioRisk({cash:0,positions:[{symbol:'A',quantity:3,cost:1},{symbol:'B',quantity:1,cost:1}]},a);
  assert.ok(r.holdings[1].riskContribution<0);near(r.holdings.reduce((s,h)=>s+h.riskContribution,0),1);
});
test('Từ chối vị thế trùng, mã lạ, số âm, NaN và khối lượng lẻ',()=>{
  const base=samples[0].portfolio,p=base.positions[0];
  for(const next of [{...base,cash:-1},{...base,cash:NaN},{...base,positions:[p,p]},{...base,positions:[{...p,symbol:'BAD'}]},{...base,positions:[{...p,quantity:1.5}]},{...base,positions:[{...p,cost:0}]}])assert.throws(()=>engine.portfolioRisk(next,assets));
});
test('Gộp lần mua cùng mã và từ chối cả lô nếu một dòng không hợp lệ',()=>{
  const original={cash:500000,positions:[{symbol:'HUT',quantity:100,cost:10000}]};
  const purchase={symbol:'HUT',quantity:100,cost:13000};
  const newPosition={symbol:'A32',quantity:300,cost:25000};
  const result=engine.addPortfolioPurchases(original,[purchase,newPosition,{...purchase,quantity:200,cost:15000}]);
  assert.deepEqual(result,{cash:500000,positions:[{symbol:'HUT',quantity:400,cost:13250},newPosition]});
  assert.throws(()=>engine.addPortfolioPurchases(original,[newPosition,{...purchase,quantity:10000000}]));
  assert.deepEqual(original.positions,[{symbol:'HUT',quantity:100,cost:10000}]);
});
test('Adapter dùng phương sai đã đăng ký; không bịa model thiếu',()=>{
  adapter.registerQuantVariance('FPT',0.0004);const m=adapter.quantModel('FPT');
  near(m.variance,0.0004);near(m.omega,0.0004*(1-0.05-0.93));assert.equal(m.hmm,null);assert.throws(()=>adapter.quantModel('BAD'));
});
test('Cholesky tái tạo ma trận; từ chối ma trận không PSD',()=>{
  const input=[[1,.5],[.5,1]],l=sim.cholesky(input);
  for(let i=0;i<2;i++)for(let j=0;j<2;j++)near(l[i].reduce((sum,v,k)=>sum+v*l[j][k],0),input[i][j]);
  assert.throws(()=>sim.cholesky([[1,2],[2,1]]));
  assert.throws(()=>sim.cholesky([[1,.2],[.3,1]]));assert.throws(()=>sim.cholesky([[NaN,0],[0,1]]));
});
test('Phân vị có nội suy, không làm thay đổi mảng đầu vào',()=>{
  const a=[4,1,3,2];near(engine.quantile(a,.5),2.5);near(engine.quantile(a,0),1);near(engine.quantile(a,1),4);assert.deepEqual(a,[4,1,3,2]);assert.throws(()=>engine.quantile([],.5));
});
test('Cú sốc thị trường, ngành, riêng mã chỉ tác động đúng đối tượng',()=>{
  const s={...sim.defaultScenario,marketShock:-.1,sector:'Ngân hàng',sectorShock:-.2,symbol:'FPT',symbolShock:-.1};
  for(const a of assets){const expected=(.9**a.beta)*(a.sector==='Ngân hàng'?.8:1)*(a.symbol==='FPT'?.9:1)-1;near(sim.deterministicImpact(a,s),expected);}
});
test('Monte Carlo cố định seed, phân vị có thứ tự, histogram đủ đường, CVaR ≥ VaR',()=>{
  const p=samples[0].portfolio,s={...sim.defaultScenario,marketShock:-.08},original=JSON.stringify(p),a=sim.simulatePortfolio(p,assets,s),b=sim.simulatePortfolio(p,assets,s);
  assert.deepEqual(a,b);assert.equal(JSON.stringify(p),original);assert.equal(a.cone.length,21);assert.equal(a.histogram.reduce((sum,h)=>sum+h.count,0),1200);
  for(const c of a.cone)assert.ok(c.p05<=c.p25&&c.p25<=c.p50&&c.p50<=c.p75&&c.p75<=c.p95);
  assert.ok(a.cvar95>=a.var95);assert.ok(a.breachProbability>=0&&a.breachProbability<=1);assert.ok(a.lossProbability>=0&&a.lossProbability<=1);
  near(a.attribution.reduce((sum,h)=>sum+h.mean,0),a.mean-a.total,.0001);
});
test('Cả 5/20/60 phiên và stress 0/100% đều chạy được; tương quan được giữ PSD',()=>{
  for(const horizon of [5,20,60])for(const stress of [0,1]){
    const r=sim.simulatePortfolio(samples[0].portfolio,assets,{...sim.defaultScenario,horizon,stress},100),l=sim.cholesky(r.correlation);
    assert.equal(r.cone.length,horizon+1);for(let i=0;i<assets.length;i++)for(let j=0;j<assets.length;j++)near(l[i].reduce((sum,v,k)=>sum+v*l[j][k],0),r.correlation[i][j],1e-8);
  }
});
test('Tiền mặt thuần và danh mục trống có rủi ro bằng 0, không NaN',()=>{
  for(const cash of [0,100000000]){const p={positions:[],cash},r=sim.simulatePortfolio(p,assets,sim.defaultScenario,100);near(r.var95,0);near(r.cvar95,0);near(r.breachProbability,0);near(r.lossProbability,0);assert.equal(r.cone.at(-1).p05,cash);near(engine.portfolioRisk(p,assets).volatility,0);}
});
test('Bảo toàn tiền mặt và cùng đường nhiễu: giảm nửa số cổ phiếu cho kết quả affine',()=>{
  const p={cash:10000000,positions:[{symbol:'FPT',quantity:1000,cost:100000}]},total=engine.portfolioRisk(p,assets).total;
  const after={cash:p.cash+assets[0].price*500,positions:[{...p.positions[0],quantity:500}]},a=sim.simulatePortfolio(p,assets,sim.defaultScenario,100),b=sim.simulatePortfolio(after,assets,sim.defaultScenario,100);
  near(engine.portfolioRisk(after,assets).total,total);near(b.var95,a.var95/2,1e-6);near(b.cvar95,a.cvar95/2,1e-6);near(b.cone.at(-1).p05,total+(a.cone.at(-1).p05-total)/2,1e-6);
});
test('Phương án hợp nhất không bán trùng, không tăng vị thế, giữ nguyên gốc và tài sản',()=>{
  for(const {portfolio:p} of samples){const saved=JSON.stringify(p),r=sim.rebalancePreview(p,assets,sim.defaultLimits,{...sim.defaultScenario,...sim.scenarioPresets[3].settings});
    assert.equal(JSON.stringify(p),saved);near(r.after.total,r.before.total);assert.equal(new Set(r.changes.map(c=>c.symbol)).size,r.changes.length);near(r.portfolio.cash-p.cash,r.changes.reduce((sum,c)=>sum+c.proceeds,0));
    for(const h of r.portfolio.positions){assert.ok(Number.isInteger(h.quantity)&&h.quantity>0);assert.ok(h.quantity<=p.positions.find(a=>a.symbol===h.symbol).quantity);}
    assert.ok(r.after.holdings.every(h=>h.weight<=sim.defaultLimits.stock+1e-8));assert.ok(r.after.sectors.every(h=>h.weight<=sim.defaultLimits.sector+1e-8));assert.ok(r.after.volatility<=sim.defaultLimits.volatility+1e-8);assert.ok(r.simulation.var95<=r.before.total*sim.defaultLimits.budget+1);assert.equal(r.compliant,true);
  }
});
test('Từ chối thiết lập ngoài miền và thiếu model, không âm thầm fallback',()=>{
  for(const change of [{horizon:0},{stress:1.1},{volatility:NaN},{marketShock:-1},{sector:'BAD'},{symbol:'BAD'},{budget:0},{seed:-1},{seed:2**40}])assert.throws(()=>sim.simulatePortfolio(samples[0].portfolio,assets,{...sim.defaultScenario,...change},100));
  assert.throws(()=>sim.rebalancePreview(samples[0].portfolio,assets,{...sim.defaultLimits,stock:0},sim.defaultScenario));
});
