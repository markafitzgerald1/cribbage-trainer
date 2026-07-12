import{i as e}from"./preload-helper-BdFrVu1K.js";import{n as t,t as n}from"./AnalyticsConsentDialog-CQ3pBqqb.js";var r,i,a,o,s,c,l,u,d,f,p,m,h,g,_,v,y,b,x,S,C,w,T;e((()=>{t(),{expect:r,fireEvent:i,fn:a,waitFor:o,within:s}=__STORYBOOK_MODULE_TEST__,c={component:n,parameters:{layout:`centered`},tags:[`autodocs`],title:`AnalyticsConsentDialog`},l={consent:!0,onChange:()=>null},u=e=>({args:{...l,consent:e}}),d=async e=>{let t=s(e).getByRole(`button`,{name:`Privacy Policy`});await i.click(t),await r(e).toHaveTextContent(`Privacy Policy for Cribbage Trainer`)},f=e=>({args:l,play:async({canvasElement:t})=>{await d(t),e&&await e(t)}}),p=u(null),m=u(!0),h=u(!1),g=async e=>{let t=s(e);return await i.click(t.getByRole(`button`,{name:`Analytics Settings`})),t},_=e=>({consent:e,onChange:a()}),v=(e,t)=>({args:_(e),play:async({args:n,canvasElement:a})=>{let o=await g(a);await i.click(o.getByText(t)),await r(n.onChange).toHaveBeenCalledWith(!e)}}),y=v(!1,`Allow analytics`),b=v(!0,`Disable analytics`),x={args:_(!0),play:async({args:e,canvasElement:t})=>{await g(t);let n=s(t);await r(t).toHaveTextContent(`Analytics is currently enabled`),await i.click(n.getByRole(`button`,{name:`Close`})),await o(async()=>{await r(n.getByRole(`button`,{name:`Analytics Settings`})).toBeVisible()}),await r(e.onChange).not.toHaveBeenCalled()}},S=f(),C=f(async e=>{let t=e.querySelector(`[class*="overlay"]`);await r(t).not.toBeNull(),await i.mouseDown(t),await r(e).not.toHaveTextContent(`Privacy Policy for Cribbage Trainer`)}),w=f(async e=>{await i.keyDown(e,{key:`Escape`}),await r(e).not.toHaveTextContent(`Privacy Policy for Cribbage Trainer`)}),p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`createStoryWithConsent(null)`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`createStoryWithConsent(true)`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`createStoryWithConsent(false)`,...h.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`createSettingsStory(false, "Allow analytics")`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`createSettingsStory(true, "Disable analytics")`,...b.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  args: createSettingsArgs(true),
  play: async ({
    args,
    canvasElement
  }) => {
    await openAnalyticsSettings(canvasElement);
    const canvas = within(canvasElement);
    await expect(canvasElement).toHaveTextContent("Analytics is currently enabled");
    await fireEvent.click(canvas.getByRole("button", {
      name: "Close"
    }));
    await waitFor(async () => {
      await expect(canvas.getByRole("button", {
        name: "Analytics Settings"
      })).toBeVisible();
    });
    await expect(args.onChange).not.toHaveBeenCalled();
  }
}`,...x.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`createPrivacyStory()`,...S.parameters?.docs?.source}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`createPrivacyStory(async canvasElement => {
  const overlay = canvasElement.querySelector('[class*="overlay"]');
  await expect(overlay).not.toBeNull();
  await fireEvent.mouseDown(overlay as Element);
  await expect(canvasElement).not.toHaveTextContent("Privacy Policy for Cribbage Trainer");
})`,...C.parameters?.docs?.source}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`createPrivacyStory(async canvasElement => {
  await fireEvent.keyDown(canvasElement, {
    key: "Escape"
  });
  await expect(canvasElement).not.toHaveTextContent("Privacy Policy for Cribbage Trainer");
})`,...w.parameters?.docs?.source}}},T=[`ConsentUnknownOrUnspecifiedDialog`,`ConsentGivenDialog`,`ConsentNotGivenDialog`,`ConsentCanBeGranted`,`ConsentCanBeWithdrawn`,`AnalyticsSettingsCanBeDismissed`,`PrivacyPolicyOpens`,`PrivacyPolicyClosesOnOutsideClick`,`PrivacyPolicyClosesWithEscape`]}))();export{x as AnalyticsSettingsCanBeDismissed,y as ConsentCanBeGranted,b as ConsentCanBeWithdrawn,m as ConsentGivenDialog,h as ConsentNotGivenDialog,p as ConsentUnknownOrUnspecifiedDialog,C as PrivacyPolicyClosesOnOutsideClick,w as PrivacyPolicyClosesWithEscape,S as PrivacyPolicyOpens,T as __namedExportsOrder,c as default};