import {test,expect,type Page} from '@playwright/test';
import {analysisFixture} from './fixtures/analysis';
import {quantModuleItems} from '../src/components/quant-module-navigation';
import {moduleGuides} from '../src/lib/quant-reader';
import {moduleMetricTerms} from '../src/content/quant-module-terms';
import {getTerm} from '../src/content/legacy/glossary';

async function openReport(page:Page) {
  const state=await analysisFixture(page); state.status='SUCCEEDED';
  for(const [name,guide] of Object.entries(moduleGuides)) {
    if(name==='directional_alpha') continue;
    for(const [,path] of guide.metrics) {
      const keys=path.split('.'); let parent=state.report.sections[name].metrics;
      for(const key of keys.slice(0,-1)) parent=(parent[key]??={}) as Record<string,unknown>;
      if(parent[keys.at(-1)!]===undefined) parent[keys.at(-1)!]=.5;
    }
  }
  state.report.sections.arima.status='AVAILABLE';
  state.report.sections.garch.metrics={garch:{garch:{current_vol_pct:2,alpha:.09,beta:.87,persistence:.96,half_life:17,forecast_vol:[2,2.1,2.2],simulation_params:{omega_pct2:.1,alpha:.09,beta:.87}},egarch:{gamma:-.12}}};
  state.report.sections.hmm.metrics={hmm:{current:'BULL',prob_pct:67,state_probs:{BULL:67,SIDEWAY:24,BEAR:9},method:'multivariate_hmm'}};
  state.report.sections.directional_alpha.metrics={momentum_alpha:{score:0,active:false,components:{ret_5d_pct:1,ret_10d_pct:2,ret_20d_pct:3,ret_60d_pct:4}},hurst:{hurst:.61,regime:'PERSISTENT',confidence:.75,windows:[{window:64,hurst:.61}]},lightgbm_cross_sectional:{available:true,active:true,proj_pct:2,rank_pct:80,predicted_alpha_pct:1},conditional_mr:{active:false,reason:'regime_or_extreme_not_confirmed'}};
  state.jobs.push({id:'job-1',symbol:'FPT',target_session:'2026-10-16',status:'SUCCEEDED',created_at:1792224000,deadline:1792310400,attempt:1,report_id:'report-1',reason:null,quota_effect:'CONSUMED'});
  await page.goto('/analysis?symbol=FPT&job=job-1');
  await expect(page.locator('.quant-report-section')).toHaveCount(16);
  return state;
}

test('All 16 module buttons reopen their section and metrics open distinct five-part explanations',async({page})=>{
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  const state=await openReport(page),nav=page.getByRole('navigation',{name:'Điều hướng module',exact:true});
  await expect(nav.getByRole('button')).toHaveCount(16);
  for(const [name,label] of quantModuleItems) {
    // Moving the page beneath a stationary test cursor can open an unrelated
    // hover definition. Dismiss it before exercising the next navigation item.
    await page.mouse.move(0,0); await page.keyboard.press('Escape');
    const section=page.locator(`[data-quant-module="${name}"]`);
    await section.locator(':scope > summary').click();
    await expect(section).not.toHaveAttribute('open','');
    await nav.getByRole('button',{name:label,exact:true}).click();
    await page.mouse.move(0,0); await page.keyboard.press('Escape');
    await expect(section).toHaveAttribute('open','');
    await expect(section.getByText('Hiểu mô hình · phương pháp & điều kiện',{exact:true})).toBeVisible();
    if(name==='directional_alpha') {
      await expect(section.getByLabel('Bằng chứng Momentum',{exact:true})).toBeVisible();
      await expect(section.locator('[data-alpha-value="momentum"]')).toHaveText('0');
    } else {
      await expect(section.getByRole('heading',{name:'Biểu đồ & bằng chứng',exact:true})).toBeVisible();
      for(const [,path] of moduleGuides[name].metrics) expect(getTerm(moduleMetricTerms[path])).toBeTruthy();
    }
  }
  for(const name of ['garch','hmm']) {
    const section=page.locator(`[data-quant-module="${name}"]`);
    for(const [label,path] of moduleGuides[name].metrics) {
      const trigger=section.locator('dt').getByRole('button',{name:label,exact:true});
      await trigger.focus(); await trigger.press('Enter');
      const popup=page.getByRole('tooltip');
      await expect(popup.locator('.term-title')).toHaveText(getTerm(moduleMetricTerms[path])!.en);
      await expect(popup.getByRole('heading')).toHaveCount(5);
      await expect(popup.locator('.katex-error')).toHaveCount(0);
      await page.keyboard.press('Escape'); await trigger.blur();
    }
  }
  expect(errors).toEqual([]);expect(state.created).toBe(0);expect(state.unknown).toEqual([]);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBeTruthy();
  await page.locator('[data-quant-module="garch"]').screenshot({path:`test-results/ui/${test.info().project.name}/quant-garch-module.png`,scale:'css'});
});

test('GARCH surface and factor 3D preserve their source values and return to original 2D charts',async({page})=>{
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await openReport(page);
  const garch=page.locator('[data-quant-module="garch"]');
  await garch.getByRole('group',{name:'Góc nhìn biến động GARCH',exact:true}).getByRole('button',{name:'3D',exact:true}).click();
  await expect(garch.getByRole('img',{name:'Mặt phản ứng GARCH 3D FPT',exact:true})).toBeVisible();
  await garch.getByRole('img').press('ArrowRight');
  await expect(garch).toContainText('không phải phân phối hoặc một dự báo mới');
  await garch.getByRole('button',{name:'2D',exact:true}).click();
  await expect(garch.getByRole('img',{name:'Đường biến động trong module GARCH',exact:true})).toBeVisible();
  const factors=page.locator('[data-quant-module="commentary"]');
  await factors.getByRole('group',{name:'Góc nhìn hồ sơ nhân tố',exact:true}).getByRole('button',{name:'3D',exact:true}).click();
  await expect(factors.getByRole('img',{name:'Hồ sơ nhân tố 3D từ báo cáo',exact:true})).toBeVisible();
  await factors.getByRole('slider',{name:'Xoay góc nhân tố',exact:true}).press('End');
  await expect(factors).toContainText('giá trị gốc 0,3');
  await factors.getByRole('button',{name:'Radar',exact:true}).click();
  await expect(factors.getByRole('img',{name:'Hồ sơ nhân tố trong module nhận định',exact:true})).toBeVisible();
  expect(errors).toEqual([]);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBeTruthy();
});
