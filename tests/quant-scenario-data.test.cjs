const test=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {buildSync}=require('esbuild');
function load(file){const output=buildSync({entryPoints:[path.join(__dirname,'..',file)],tsconfig:path.join(__dirname,'../frontend/tsconfig.json'),bundle:true,platform:'node',format:'cjs',write:false});const module={exports:{}};new Function('require','module','exports',output.outputFiles[0].text)(require,module,module.exports);return module.exports;}
const {scenarioScenes,hmmPhaseData}=load('frontend/src/lib/quant-scenario-data.ts');
const {reportFixture}=load('frontend/tests/fixtures/analysis.ts');
test('Monte Carlo 3D preserves published quantiles and never mutates report output',()=>{
 const report=reportFixture(),before=JSON.stringify(report),scene=scenarioScenes(report,'monte').history;
 assert.equal(scene.series.length,5);assert.deepEqual(scene.series[2].points.map(p=>p.z),report.research.cone.map(p=>p.p50));assert.deepEqual(scene.domains[1],[5,95]);assert.equal(JSON.stringify(report),before);
});
test('Missing, disabled, failed and malformed Monte Carlo output has no fabricated surface',()=>{
 for(const change of [r=>r.research.cone=[],r=>r.sections.simulation_risk.status='DISABLED',r=>r.sections.simulation_risk.metrics.simulation_risk={error:'failed'},r=>r.research.cone[0].p05=-1,r=>r.research.cone[1].session=1,r=>r.research.symbol='OTHER']){const report=reportFixture();change(report);assert.equal(scenarioScenes(report,'monte').history,null);}
});
test('HMM triangle preserves observed labels and reads current probabilities separately',()=>{
 const report=reportFixture();report.sections.hmm.metrics={hmm:{state_probs:{BULL:67,SIDEWAY:24,BEAR:9}}};
 const data=hmmPhaseData(report);assert.deepEqual(data.history,report.research.regime);assert.deepEqual(data.probabilities,{BULL:67,SIDEWAY:24,BEAR:9});assert.ok(!('transition_matrix' in data));
});
test('HMM accepts zero probabilities, rejects out-of-range/incomplete output and does not invent probability history',()=>{
 const report=reportFixture();report.sections.hmm.metrics={hmm:{state_probs:{BULL:0,SIDEWAY:100,BEAR:0}}};assert.deepEqual(hmmPhaseData(report).probabilities,{BULL:0,SIDEWAY:100,BEAR:0});
 report.sections.hmm.metrics={hmm:{state_probs:{BULL:120,SIDEWAY:0,BEAR:0}}};assert.equal(hmmPhaseData(report).probabilities,null);assert.equal(hmmPhaseData(report).history.length,3);
 report.research.regime[1].state='UNKNOWN';assert.deepEqual(hmmPhaseData(report).history,[]);
 report.sections.hmm.status='DISABLED';assert.equal(hmmPhaseData(report).probabilities,null);assert.deepEqual(hmmPhaseData(report).history,[]);
});
