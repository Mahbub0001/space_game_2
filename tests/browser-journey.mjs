import {chromium,expect} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
await mkdir('previews',{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
const page=await browser.newPage({viewport:{width:1440,height:900}});const errors=[];
page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>{
  localStorage.setItem('odyssey-settings',JSON.stringify({voice:false,quality:false,muted:true}));
  // Accelerate the test clock while retaining real simulation updates and real keyboard actions.
  const raf=window.requestAnimationFrame.bind(window);window.requestAnimationFrame=callback=>raf(timestamp=>callback(timestamp*8));
});
await page.goto('http://127.0.0.1:4173');await page.locator('#loading').waitFor({state:'hidden'});
await page.locator('#design-button').click();await page.locator('#launch-button').click();
const deadline=Date.now()+300000,seen=new Set();let completed=false;
while(Date.now()<deadline){
  if(await page.locator('#begin-stage').isVisible()){
    const chapter=await page.locator('#flight-chapter').textContent();console.log('PLAYING',chapter);
    await page.locator('#begin-stage').click();
    if((await page.locator('#assist-button').innerText()).includes('OFF'))await page.keyboard.press('g');
    await page.keyboard.press('Digit2');await page.keyboard.up('e');await page.keyboard.down('e');
    if(!seen.has(chapter)){await page.screenshot({path:`previews/journey-${chapter.slice(0,2)}.png`});seen.add(chapter);}
  }
  if(await page.locator('[data-effect]').first().isVisible()){
    console.log('STORY',await page.locator('#dialog-title').textContent());await page.locator('[data-effect]').first().click();await page.keyboard.up('e');await page.keyboard.down('e');
  }
  if(await page.locator('#export-button').isVisible()){completed=true;console.log('COMPLETE',await page.locator('.debrief-stats').innerText());await page.screenshot({path:'previews/journey-complete.png'});break;}
  if(await page.locator('#retry-button').isVisible())throw new Error('Mission interrupted: '+await page.locator('#dialog-title').textContent());
  await page.waitForTimeout(300);
}
await page.keyboard.up('e');
expect(completed,'The complete browser campaign should reach the debrief').toBe(true);
expect(errors).toEqual([]);console.log('BROWSER_JOURNEY_OK',seen.size,'chapters. Errors:',errors);
await browser.close();
