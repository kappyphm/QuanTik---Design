const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {buildSync}=require('esbuild');
const output=buildSync({entryPoints:[path.join(__dirname,'../frontend/src/lib/factor-profile.ts')],bundle:true,platform:'node',format:'cjs',write:false});
const compiled={exports:{}};new Function('require','module','exports',output.outputFiles[0].text)(require,compiled,compiled.exports);
const {factorProfile,drawdownSeries}=compiled.exports;
const reports=require('../backend/mock/analysis-visuals.json').reports;
const demo=require('../backend/mock/demo.json');
test('Factor scores remain bounded, preserve missing values and match neutral anchors',()=>{
 const report=reports[0], result={...demo.results[0],metrics:{AA:null,N:null,AG:null}};
 const factors=factorProfile(result,{...report,performance:{cmf:0,er:.5,relativeStrengthPct:0}});
 assert.deepEqual(factors.map(f=>f.score),[50,null,50,50,null,null]);
 const extremes=factorProfile({...result,metrics:{AA:'2',N:'-10',AG:'999'}},{...report,performance:{cmf:-2,er:2,relativeStrengthPct:99}});
 assert.deepEqual(extremes.map(f=>f.score),[100,100,0,100,0,100]);
 for(const r of demo.results){const report=reports.find(p=>p.symbol===r.symbol);if(report)for(const f of factorProfile(r,report))assert.ok(f.score===null || f.score>=0 && f.score<=100);}
});
test('Drawdown uses running peaks and recovers to zero at a new high',()=>{
 assert.deepEqual(drawdownSeries([100,80,120,90]).map(n=>Math.round(n)),[0,-20,0,-25]);
 assert.deepEqual(drawdownSeries([]),[]);
});
