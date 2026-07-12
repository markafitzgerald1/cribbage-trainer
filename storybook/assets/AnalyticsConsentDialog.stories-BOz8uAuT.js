import{i as e}from"./preload-helper-BdFrVu1K.js";import{n as t,t as n}from"./AnalyticsConsentDialog-vJk9-MLo.js";var r,i,a,o,s,c,l,u,d,f,p,m,h,g,_,v,y,b,x,S,C,w,T,E,D,O,k;e((()=>{t(),{expect:r,fireEvent:i,fn:a,waitFor:o,within:s}=__STORYBOOK_MODULE_TEST__,c={component:n,parameters:{layout:`centered`},tags:[`autodocs`],title:`AnalyticsConsentDialog`},l={consent:!0,onAllowDecisionQuality:()=>null,onChange:()=>null,onPolicyUpdateChoice:()=>null},u=e=>({args:{...l,consent:e}}),d=async e=>{let t=s(e).getByRole(`button`,{name:`Privacy Policy`});await i.click(t),await r(e).toHaveTextContent(`Privacy Policy for Cribbage Trainer`)},f=e=>({args:l,play:async({canvasElement:t})=>{await d(t),e&&await e(t)}}),p=u(null),m=u(!0),h=u(!1),g=async e=>{let t=s(e);return await i.click(t.getByRole(`button`,{name:`Analytics Settings`})),t},_=e=>({consent:e,onAllowDecisionQuality:a(),onChange:a(),onPolicyUpdateChoice:a()}),v=({actionName:e,consent:t,decisionQualityConsented:n=!0,verify:r})=>({args:{..._(t),decisionQualityConsented:n},play:async({args:t,canvasElement:n})=>{let a=await g(n);await i.click(a.getByText(e)),await r(t)}}),y=v({actionName:`Allow analytics`,consent:!1,verify:async({onChange:e})=>{await r(e).toHaveBeenCalledWith(!0)}}),b=v({actionName:`Disable analytics`,consent:!0,verify:async({onChange:e})=>{await r(e).toHaveBeenCalledWith(!1)}}),x={args:_(!0),play:async({args:e,canvasElement:t})=>{await g(t);let n=s(t);await r(t).toHaveTextContent(`Analytics is currently enabled`),await i.click(n.getByRole(`button`,{name:`Close`})),await o(async()=>{await r(n.getByRole(`button`,{name:`Analytics Settings`})).toBeVisible()}),await r(e.onChange).not.toHaveBeenCalled()}},S=f(),C=f(async e=>{let t=e.querySelector(`[class*="overlay"]`);await r(t).not.toBeNull(),await i.mouseDown(t),await r(e).not.toHaveTextContent(`Privacy Policy for Cribbage Trainer`)}),w=f(async e=>{await i.keyDown(e,{key:`Escape`}),await r(e).not.toHaveTextContent(`Privacy Policy for Cribbage Trainer`)}),T=(e,t)=>({args:{consent:!0,isPolicyUpdate:!0,onAllowDecisionQuality:a(),onChange:a(),onPolicyUpdateChoice:a()},play:async({args:n,canvasElement:a})=>{await r(a).toHaveTextContent(`Analytics Consent Update`),await i.click(s(a).getByRole(`button`,{name:e})),await t(n)}}),E=T(`Accept`,async({onPolicyUpdateChoice:e})=>{await r(e).toHaveBeenCalledWith(!0)}),D=T(`Decline`,async({onChange:e,onPolicyUpdateChoice:t})=>{await r(t).toHaveBeenCalledWith(!1),await r(e).not.toHaveBeenCalled()}),O=v({actionName:`Allow decision-quality measurements`,consent:!0,decisionQualityConsented:!1,verify:async({onAllowDecisionQuality:e,onChange:t})=>{await r(e).toHaveBeenCalledTimes(1),await r(t).not.toHaveBeenCalled()}}),p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`createStoryWithConsent(null)`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`createStoryWithConsent(true)`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`createStoryWithConsent(false)`,...h.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`createSettingsStory({
  actionName: "Allow analytics",
  consent: false,
  verify: async ({
    onChange
  }) => {
    await expect(onChange).toHaveBeenCalledWith(true);
  }
})`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`createSettingsStory({
  actionName: "Disable analytics",
  consent: true,
  verify: async ({
    onChange
  }) => {
    await expect(onChange).toHaveBeenCalledWith(false);
  }
})`,...b.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
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
})`,...w.parameters?.docs?.source}}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`createPolicyUpdateStory("Accept", async ({
  onPolicyUpdateChoice
}) => {
  await expect(onPolicyUpdateChoice).toHaveBeenCalledWith(true);
})`,...E.parameters?.docs?.source}}},D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`createPolicyUpdateStory("Decline", async ({
  onChange,
  onPolicyUpdateChoice
}) => {
  await expect(onPolicyUpdateChoice).toHaveBeenCalledWith(false);
  await expect(onChange).not.toHaveBeenCalled();
})`,...D.parameters?.docs?.source}}},O.parameters={...O.parameters,docs:{...O.parameters?.docs,source:{originalSource:`createSettingsStory({
  actionName: "Allow decision-quality measurements",
  consent: true,
  decisionQualityConsented: false,
  verify: async ({
    onAllowDecisionQuality,
    onChange
  }) => {
    await expect(onAllowDecisionQuality).toHaveBeenCalledTimes(1);
    await expect(onChange).not.toHaveBeenCalled();
  }
})`,...O.parameters?.docs?.source}}},k=[`ConsentUnknownOrUnspecifiedDialog`,`ConsentGivenDialog`,`ConsentNotGivenDialog`,`ConsentCanBeGranted`,`ConsentCanBeWithdrawn`,`AnalyticsSettingsCanBeDismissed`,`PrivacyPolicyOpens`,`PrivacyPolicyClosesOnOutsideClick`,`PrivacyPolicyClosesWithEscape`,`PolicyUpdateAccepted`,`PolicyUpdateDeclined`,`DecisionQualityAllowedInSettings`]}))();export{x as AnalyticsSettingsCanBeDismissed,y as ConsentCanBeGranted,b as ConsentCanBeWithdrawn,m as ConsentGivenDialog,h as ConsentNotGivenDialog,p as ConsentUnknownOrUnspecifiedDialog,O as DecisionQualityAllowedInSettings,E as PolicyUpdateAccepted,D as PolicyUpdateDeclined,C as PrivacyPolicyClosesOnOutsideClick,w as PrivacyPolicyClosesWithEscape,S as PrivacyPolicyOpens,k as __namedExportsOrder,c as default};