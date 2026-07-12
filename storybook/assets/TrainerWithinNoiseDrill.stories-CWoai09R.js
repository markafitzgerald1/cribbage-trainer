import{n as e}from"./rolldown-runtime-sJBDdmOt.js";import{s as t,t as n}from"./expectedCribPoints-BcTYWPuV.js";import{c as r,d as i,m as a}from"./mistakeQueue-BUzJ11ZB.js";import{i as o,n as s,r as c,t as l}from"./randomNumberGenerator-B2d202er.js";import{i as u,n as d,r as f,t as p}from"./mistakeQueue.test.common-DZ-RbY_E.js";var m,h,g,_,v,y,b,x,S,C,w,T,E,D,O,k,A,j,M;function N(){return(N=e((()=>{u(),i(),t(),o(),s(),{expect:m,fireEvent:h,waitFor:g,within:_}=__STORYBOOK_MODULE_TEST__,v={args:{generateRandomNumber:l(`1`),loadGoogleAnalytics:()=>null,trackEvent:()=>null},component:c,parameters:{layout:`fullscreen`},title:`Trainer/Within-noise drill retry`},y=`QD,9S,6S,6H,2S,AH|Dealer`,b=`125%`,x=`Within noise (approximate): counts as a successful retry. 1 of 2 toward mastery.`,S={timeout:1e4},C=/points behind the best choice/u,w=e=>p({lifetime:{decisions:1,expectedPointsLossTotal:1.5,optimalDecisions:0,skippedHands:0},practice:e===0?[]:[f({consecutiveSuccesses:e,handKey:y})],records:[d({cribRole:n.Dealer,discardKey:`6S,6H`,expectedPointsLoss:1.5,handKey:y})]}),T=(e,t=``)=>(localStorage.setItem(r,JSON.stringify(w(e))),document.documentElement.style.fontSize=t,()=>{localStorage.removeItem(r),document.documentElement.style.fontSize=``}),E=(e,t)=>_(e).getAllByRole(`checkbox`).find(e=>e.closest(`label`)?.textContent?.startsWith(t)),D=async(e,t)=>(await h.click(_(e).getByRole(`button`,{name:`Mistake queue`})),await h.click(_(e).getByRole(`button`,{name:`Practice this`})),await Promise.all(t.map(t=>h.click(E(e,t)))),await h.click(_(e).getByRole(`button`,{name:`Check discard`})),_(e)),O=async(e,t)=>{let n=e.getBoundingClientRect(),r=_(e).getByText(t).parentElement.getBoundingClientRect();await m(r.top).toBeGreaterThanOrEqual(n.top),await m(r.bottom).toBeLessThanOrEqual(n.bottom)},k=e=>g(async()=>{await m(a().practice[0]).toMatchObject(e)}),A={beforeEach:()=>T(0,b),play:async({canvasElement:e})=>{let t=await D(e,[`Q`,`2`]),n=t.getByLabelText(`Practice drill`);await m(await t.findByText(x,{},S)).toBeVisible(),await m(t.queryByText(C)).toBeNull(),await m(n.scrollTop).toBe(0),await m(n.scrollHeight).toBeLessThanOrEqual(n.clientHeight),await O(n,/^Retry/u),await O(n,/^Then/u),await k({attempts:1,consecutiveSuccesses:1,wrong:0}),await m(a().attemptLog?.at(-1)).toMatchObject({basis:`sampling-noise-v1`,outcome:`success`})}},j={beforeEach:()=>T(1),play:async({canvasElement:e})=>{let t=await D(e,[`9`,`A`]),n=await t.findByText(C,{},S);await m(n).toBeVisible(),await m(t.queryByText(/Within noise/u)).toBeNull(),await k({attempts:2,consecutiveSuccesses:0,wrong:1})}},M=[`WithinNoiseRetryCountsAsSuccess`,`WorseRetryStillFailsAndResetsStreak`],A.parameters={...A.parameters,docs:{...A.parameters?.docs,source:{originalSource:`{
  beforeEach: () => seedWithinNoiseTally(0, LARGE_TEXT_ROOT_FONT_SIZE),
  play: async ({
    canvasElement
  }: {
    canvasElement: HTMLElement;
  }) => {
    const canvas = await startDrillAndRetry(canvasElement, ["Q", "2"]);
    const panel = canvas.getByLabelText("Practice drill");
    await expect(await canvas.findByText(WITHIN_NOISE_OUTCOME, {}, VERDICT_TIMEOUT)).toBeVisible();
    await expect(canvas.queryByText(BEHIND_BEST_CHOICE)).toBeNull();
    await expect(panel.scrollTop).toBe(0);
    await expect(panel.scrollHeight).toBeLessThanOrEqual(panel.clientHeight);
    await expectRowFullyOnScreen(panel, /^Retry/u);
    await expectRowFullyOnScreen(panel, /^Then/u);
    await expectStoredPractice({
      attempts: 1,
      consecutiveSuccesses: 1,
      wrong: 0
    });
    await expect(readTallyForDisplay().attemptLog?.at(-1)).toMatchObject({
      basis: "sampling-noise-v1",
      outcome: "success"
    });
  }
}`,...A.parameters?.docs?.source}}},j.parameters={...j.parameters,docs:{...j.parameters?.docs,source:{originalSource:`{
  beforeEach: () => seedWithinNoiseTally(1),
  play: async ({
    canvasElement
  }: {
    canvasElement: HTMLElement;
  }) => {
    const worseRetry = await startDrillAndRetry(canvasElement, ["9", "A"]);
    const outcome = await worseRetry.findByText(BEHIND_BEST_CHOICE, {}, VERDICT_TIMEOUT);
    await expect(outcome).toBeVisible();
    await expect(worseRetry.queryByText(/Within noise/u)).toBeNull();
    await expectStoredPractice({
      attempts: 2,
      consecutiveSuccesses: 0,
      wrong: 1
    });
  }
}`,...j.parameters?.docs?.source}}}})))()}N();export{A as WithinNoiseRetryCountsAsSuccess,j as WorseRetryStillFailsAndResetsStreak,M as __namedExportsOrder,v as default};