import{n as e}from"./rolldown-runtime-sJBDdmOt.js";import{t}from"./jsx-runtime-MKhVqBIO.js";import{c as n,l as r,o as i,u as ee}from"./Card-atDF3gat.js";import{n as te,t as a}from"./SortOrder-CEtbOzlr.js";import{n as ne,r as re,t as ie}from"./SortOrderName-CZNMd6op.js";import{a as ae,l as oe,n as se}from"./stories.common-ClFJeHpz.js";import{c as ce,u as le}from"./classifyMistake-C1n_ZRH3.js";import{s as ue,t as de}from"./expectedCribPoints-BcTYWPuV.js";import{c as o,p as fe,u as pe}from"./mistakeQueue-XAdBG93Q.js";import{a as me,n as s,r as c,t as he}from"./MistakeQueueDialog.test.common-Cy19bV_6.js";import{a as l,c as ge,d as _e,f as ve,h as ye,i as be,m as xe,n as Se,o as Ce,p as we,r as u,s as d,t as Te,u as f}from"./randomNumberGenerator-pJSzfm2r.js";var p,m,h,g,_,v,y,b,x,S,C,w,T,E,D,O,k,A,j,M,N,P,F,I,L,R,z,B,V,H,U,W,G,K,q,J,Y,X,Z,Q;function $(){return($=e((()=>{xe(),te(),ae(),ee(),pe(),me(),ue(),le(),be(),Ce(),Se(),re(),p=t(),{expect:m,fireEvent:h,waitFor:g,within:_}=__STORYBOOK_MODULE_TEST__,v={argTypes:se(`sortOrder`,ie),args:{generateRandomNumber:Te(`1`),loadGoogleAnalytics:()=>null,trackEvent:()=>null},beforeEach:()=>()=>{ve(),l()},component:u,parameters:{layout:`fullscreen`},tags:[`autodocs`],title:`Trainer`},y=(e,t)=>_(e).getByRole(`button`,{name:t}),b=async(e,t)=>{await g(async()=>{await m(_(e).queryByText(`Loading analysis...`)).toBeNull()},{timeout:1e4}),await Promise.all(t.map(async t=>await m(_(e).getByRole(`columnheader`,{name:t})).toBeVisible()))},x={play:async({canvasElement:e})=>{let t=y(e,`Accept`);await h.click(t),await m(e).toHaveTextContent(`Thank you! Analytics cookies and card-free interaction measurements help us improve the site. For more details, please see our Privacy Policy.`)}},S={play:async({canvasElement:e})=>{let t=y(e,`Decline`);await h.click(t),await m(e).toHaveTextContent(`Analytics is disabled. Nothing is sent to Google Analytics. You can find more information in our Privacy Policy.`)}},C=(e,t)=>({play:t,render:({generateRandomNumber:t,loadGoogleAnalytics:n,trackEvent:r})=>(e(),(0,p.jsx)(u,{generateRandomNumber:t,loadGoogleAnalytics:n,trackEvent:r}))}),w=C(()=>ye(!0),async({canvasElement:e})=>{await g(async()=>{await m(_(e).getByText(`Privacy Policy`)).toBeVisible()},{timeout:1e3}),await m(_(e).queryByText(`Thank you!`)).not.toBeInTheDocument(),await m(_(e).getByRole(`button`,{name:`Analytics Settings`})).toBeVisible()}),T=()=>{localStorage.setItem(f,`true`)},E=C(T,async({canvasElement:e})=>{await m(e).toHaveTextContent(`Analytics Consent Update`),await h.click(y(e,`Decline`)),await m(e).not.toHaveTextContent(`Analytics Consent Update`),await m(localStorage.getItem(f)).toBe(`true`)}),D=()=>localStorage.getItem(`analyticsAcceptedMeasurements`)??``,O=C(T,async({canvasElement:e})=>{await h.click(y(e,`Accept`)),await m(D()).toContain(d),await m(e).not.toHaveTextContent(`Analytics Consent Update`)}),k=C(()=>{localStorage.setItem(f,`true`),localStorage.setItem(_e,ge),localStorage.setItem(we,d)},async({canvasElement:e})=>{await h.click(y(e,`Analytics Settings`)),await h.click(y(e,`Allow decision-quality measurements`)),await m(D()).toContain(d)}),A={play:async({canvasElement:e})=>{let t=y(e,`Deal`),n=e.textContent;await h.click(t),await m(e.textContent).not.toEqual(n)}},j=e=>b(e,[`Hand`,`Crib`,`Play`,`Net`]),M=async e=>{let t=_(e).getAllByRole(`checkbox`);await h.click(t[0]),await h.click(t[1])},N={play:async({canvasElement:e})=>{await M(e),await j(e)}},P=(e=!1)=>async t=>{await N.play(t),await oe(t,{toggleStarterDetails:e})},F={...N,play:P()},I={...N,play:P(!0)},L=e=>async({canvasElement:t})=>{let n=_(t).getAllByRole(`radio`).find(t=>t.getAttribute(`value`)===ne(e)),r=t.textContent;await h.click(n),await m(t.textContent).not.toEqual(r),l()},R={play:L(a.DealOrder)},z={play:L(a.Ascending)},B=r(i.SIX,n.SPADES),V=r(i.FIVE,n.HEARTS),H={args:{initialCards:[r(i.KING,n.HEARTS),r(i.QUEEN,n.SPADES),r(i.TEN,n.DIAMONDS),r(i.NINE,n.CLUBS),B,V],initialCribRole:de.Pone,initialDiscards:[B,V],initialScoreSortKey:ce.ExpectedHandPoints,initialSortOrder:a.DealOrder},play:async({canvasElement:e})=>{await m(_(e).getByText(`Pone`)).toBeVisible(),await j(e);let t=_(e).getByRole(`columnheader`,{name:/Hand/u});await m(t).toHaveAttribute(`aria-sort`,`descending`)}},U={play:async e=>{await N.play(e);let t=_(e.canvasElement).getByRole(`button`,{name:/^Play:/u});await h.click(t);let n=_(e.canvasElement).getByRole(`columnheader`,{name:/Play/u});await m(n).toHaveAttribute(`aria-sort`,`descending`)}},W={args:{initialCards:[r(i.ACE,n.SPADES),r(i.TWO,n.HEARTS),r(i.THREE,n.DIAMONDS),r(i.FOUR,n.CLUBS),r(i.FIVE,n.SPADES),r(i.SIX,n.HEARTS)]},play:async({canvasElement:e})=>{let t=_(e).getAllByRole(`checkbox`).map(e=>e.closest(`label`)?.textContent);await m(t).toEqual([`6♥`,`5♠`,`4♣`,`3♦`,`2♥`,`A♠`])}},G=e=>async({canvasElement:t})=>{let n=_(t);await h.click(y(t,`Enter cards`)),e&&(await h.click(n.getByRole(`button`,{name:e[0],pressed:!0})),await h.click(n.getByRole(`button`,{name:e[1]}))),await h.click(y(t,`Use hand`)),await m(n.queryByRole(`heading`,{name:`Enter cards`})).not.toBeInTheDocument()},K={args:W.args,play:G()},q={args:W.args,play:G([`A♠`,`A♣`])},J=e=>()=>(localStorage.setItem(o,JSON.stringify(e())),()=>{localStorage.removeItem(o)}),Y={beforeEach:J(()=>{let e=s.createSampleMistakeTally();return{...e,records:e.records.map(e=>({...e,recordedAdmission:`pending`}))}}),play:async({canvasElement:e})=>{await g(async()=>{await m(fe().records.map(e=>e.recordedAdmission)).toEqual([...Array.from({length:3},()=>({basis:`exact-fallback-v1`,eligible:!0})),{basis:`exact-v1`,eligible:!1}])}),await h.click(y(e,`Mistake queue`)),await m(_(e).getByRole(`heading`,{name:`Mistake queue`})).toBeVisible()}},X={beforeEach:J(s.createSampleMistakeTally),play:async({canvasElement:e})=>{await h.click(y(e,`Mistake queue`));let t=_(e);await h.click(t.getAllByRole(`button`,{name:`Practice this`})[0]),await M(e),await h.click(y(e,`Check discard`)),await m(await t.findByRole(`button`,{name:`Draw another`})).toBeVisible(),await h.click(y(e,`Draw another`)),await m(t.getByLabelText(`Practice drill`)).toBeVisible(),await h.click(y(e,`Exit drill`)),await m(t.queryByLabelText(`Practice drill`)).toBeNull(),await m(y(e,`Deal`)).toBeVisible(),await m(t.getByText(`Practice ended — fresh hand dealt.`)).toBeVisible()}},Z={beforeEach:J(s.createStraySweepTally),play:async({canvasElement:e})=>{await m(localStorage.getItem(o)).toContain(c),await M(e),await _(e).findByRole(`table`);let t=localStorage.getItem(o)??``;await m(t).not.toContain(c),await m(t).toContain(he)}},Q=[`AnalyticsAccepted`,`AnalyticsDisabled`,`StoredConsentGiven`,`StoredConsentPredatingThePolicy`,`StoredConsentAcceptingTheUpdate`,`DecisionQualityAllowedFromSettings`,`DealNewHandReplacesCards`,`DiscardShowsScoredPossibilities`,`Expanded`,`DoubleExpanded`,`SortHandInDealOrder`,`SortHandInAscendingOrder`,`DeepLinkedAnalysisState`,`SortAnalysisByPlayPoints`,`WithInitialCards`,`UnchangedManualEntryCloses`,`ChangedManualEntryApplies`,`RecoverUnfinishedDecisions`,`PracticeDrillFromMistakeQueue`,`SweepsStrayDrillRowsOnWrite`],x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  play: async ({
    canvasElement
  }: {
    canvasElement: HTMLElement;
  }) => {
    const acceptButton = getButton(canvasElement, "Accept");
    await fireEvent.click(acceptButton);
    await expect(canvasElement).toHaveTextContent("Thank you! Analytics cookies and card-free interaction measurements help us improve the site. For more details, please see our Privacy Policy.");
  }
}`,...x.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  play: async ({
    canvasElement
  }: {
    canvasElement: HTMLElement;
  }) => {
    const declineButton = getButton(canvasElement, "Decline");
    await fireEvent.click(declineButton);
    await expect(canvasElement).toHaveTextContent("Analytics is disabled. Nothing is sent to Google Analytics. You can find more information in our Privacy Policy.");
  }
}`,...S.parameters?.docs?.source}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`createStoredChoiceStory(() => storeAnalyticsChoice(true), async ({
  canvasElement
}) => {
  // When consent is already stored, only the persistent settings links are shown.
  // Wait for fade-in animation to complete before checking visibility
  await waitFor(async () => {
    await expect(within(canvasElement).getByText("Privacy Policy")).toBeVisible();
  }, {
    timeout: 1000
  });
  await expect(within(canvasElement).queryByText("Thank you!")).not.toBeInTheDocument();
  await expect(within(canvasElement).getByRole("button", {
    name: "Analytics Settings"
  })).toBeVisible();
})`,...w.parameters?.docs?.source}}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`createStoredChoiceStory(seedConsentPredatingThePolicy, async ({
  canvasElement
}) => {
  await expect(canvasElement).toHaveTextContent("Analytics Consent Update");
  await fireEvent.click(getButton(canvasElement, "Decline"));
  await expect(canvasElement).not.toHaveTextContent("Analytics Consent Update");
  await expect(localStorage.getItem(analyticsConsentKey)).toBe("true");
})`,...E.parameters?.docs?.source}}},O.parameters={...O.parameters,docs:{...O.parameters?.docs,source:{originalSource:`createStoredChoiceStory(seedConsentPredatingThePolicy, async ({
  canvasElement
}) => {
  await fireEvent.click(getButton(canvasElement, "Accept"));
  await expect(grantedMeasurements()).toContain(DECISION_QUALITY_MEASUREMENT);
  await expect(canvasElement).not.toHaveTextContent("Analytics Consent Update");
})`,...O.parameters?.docs?.source}}},k.parameters={...k.parameters,docs:{...k.parameters?.docs,source:{originalSource:`createStoredChoiceStory(() => {
  localStorage.setItem(analyticsConsentKey, "true");
  localStorage.setItem(answeredPolicyVersionKey, PRIVACY_POLICY_VERSION);
  localStorage.setItem(declinedMeasurementsKey, DECISION_QUALITY_MEASUREMENT);
}, async ({
  canvasElement
}) => {
  await fireEvent.click(getButton(canvasElement, "Analytics Settings"));
  await fireEvent.click(getButton(canvasElement, "Allow decision-quality measurements"));
  await expect(grantedMeasurements()).toContain(DECISION_QUALITY_MEASUREMENT);
})`,...k.parameters?.docs?.source}}},A.parameters={...A.parameters,docs:{...A.parameters?.docs,source:{originalSource:`{
  play: async ({
    canvasElement
  }: {
    canvasElement: HTMLElement;
  }) => {
    const dealButton = getButton(canvasElement, "Deal");
    const initialHandText = canvasElement.textContent;
    await fireEvent.click(dealButton);
    await expect(canvasElement.textContent).not.toEqual(initialHandText);
  }
}`,...A.parameters?.docs?.source}}},N.parameters={...N.parameters,docs:{...N.parameters?.docs,source:{originalSource:`{
  play: async ({
    canvasElement
  }: {
    canvasElement: HTMLElement;
  }) => {
    await clickFirstTwoCheckboxes(canvasElement);
    await expectAnalysisColumnHeaders(canvasElement);
  }
}`,...N.parameters?.docs?.source}}},F.parameters={...F.parameters,docs:{...F.parameters?.docs,source:{originalSource:`{
  ...DiscardShowsScoredPossibilities,
  play: playTrainerToggle()
}`,...F.parameters?.docs?.source}}},I.parameters={...I.parameters,docs:{...I.parameters?.docs,source:{originalSource:`{
  ...DiscardShowsScoredPossibilities,
  play: playTrainerToggle(true)
}`,...I.parameters?.docs?.source}}},R.parameters={...R.parameters,docs:{...R.parameters?.docs,source:{originalSource:`{
  play: createPlay(SortOrder.DealOrder)
}`,...R.parameters?.docs?.source}}},z.parameters={...z.parameters,docs:{...z.parameters?.docs,source:{originalSource:`{
  play: createPlay(SortOrder.Ascending)
}`,...z.parameters?.docs?.source}}},H.parameters={...H.parameters,docs:{...H.parameters?.docs,source:{originalSource:`{
  args: {
    initialCards: [createCard(Rank.KING, Suit.HEARTS), createCard(Rank.QUEEN, Suit.SPADES), createCard(Rank.TEN, Suit.DIAMONDS), createCard(Rank.NINE, Suit.CLUBS), SIX_OF_SPADES, FIVE_OF_HEARTS],
    initialCribRole: CribRole.Pone,
    initialDiscards: [SIX_OF_SPADES, FIVE_OF_HEARTS],
    initialScoreSortKey: ScoredKeepDiscardSortKey.ExpectedHandPoints,
    initialSortOrder: SortOrder.DealOrder
  },
  play: async ({
    canvasElement
  }: {
    canvasElement: HTMLElement;
  }) => {
    await expect(within(canvasElement).getByText("Pone")).toBeVisible();
    await expectAnalysisColumnHeaders(canvasElement);
    const handHeader = within(canvasElement).getByRole("columnheader", {
      name: /Hand/u
    });
    await expect(handHeader).toHaveAttribute("aria-sort", "descending");
  }
}`,...H.parameters?.docs?.source}}},U.parameters={...U.parameters,docs:{...U.parameters?.docs,source:{originalSource:`{
  play: async (context: {
    canvasElement: HTMLElement;
  }) => {
    await DiscardShowsScoredPossibilities.play(context);
    const playHeaderButton = within(context.canvasElement).getByRole("button", {
      name: /^Play:/u
    });
    await fireEvent.click(playHeaderButton);
    const playHeader = within(context.canvasElement).getByRole("columnheader", {
      name: /Play/u
    });
    await expect(playHeader).toHaveAttribute("aria-sort", "descending");
  }
}`,...U.parameters?.docs?.source}}},W.parameters={...W.parameters,docs:{...W.parameters?.docs,source:{originalSource:`{
  args: {
    initialCards: [createCard(Rank.ACE, Suit.SPADES), createCard(Rank.TWO, Suit.HEARTS), createCard(Rank.THREE, Suit.DIAMONDS), createCard(Rank.FOUR, Suit.CLUBS), createCard(Rank.FIVE, Suit.SPADES), createCard(Rank.SIX, Suit.HEARTS)]
  },
  play: async ({
    canvasElement
  }: {
    canvasElement: HTMLElement;
  }) => {
    const handCardLabels = within(canvasElement).getAllByRole("checkbox").map(checkbox => checkbox.closest("label")?.textContent);
    await expect(handCardLabels).toEqual(["6♥", "5♠", "4♣", "3♦", "2♥", "A♠"]);
  }
}`,...W.parameters?.docs?.source}}},K.parameters={...K.parameters,docs:{...K.parameters?.docs,source:{originalSource:`{
  args: WithInitialCards.args,
  play: createManualEntryPlay()
}`,...K.parameters?.docs?.source}}},q.parameters={...q.parameters,docs:{...q.parameters?.docs,source:{originalSource:`{
  args: WithInitialCards.args,
  play: createManualEntryPlay(["A♠", "A♣"])
}`,...q.parameters?.docs?.source}}},Y.parameters={...Y.parameters,docs:{...Y.parameters?.docs,source:{originalSource:`{
  beforeEach: seedStoredTally(() => {
    const tally = mistakeFixtures.createSampleMistakeTally();
    return {
      ...tally,
      records: tally.records.map(record => ({
        ...record,
        recordedAdmission: "pending"
      }))
    };
  }),
  play: async ({
    canvasElement
  }: {
    canvasElement: HTMLElement;
  }) => {
    await waitFor(async () => {
      await expect(readTallyForDisplay().records.map(record => record.recordedAdmission)).toEqual([...Array.from({
        length: 3
      }, () => ({
        basis: "exact-fallback-v1",
        eligible: true
      })), {
        basis: "exact-v1",
        eligible: false
      }]);
    });
    await fireEvent.click(getButton(canvasElement, "Mistake queue"));
    await expect(within(canvasElement).getByRole("heading", {
      name: "Mistake queue"
    })).toBeVisible();
  }
}`,...Y.parameters?.docs?.source}}},X.parameters={...X.parameters,docs:{...X.parameters?.docs,source:{originalSource:`{
  beforeEach: seedStoredTally(mistakeFixtures.createSampleMistakeTally),
  play: async ({
    canvasElement
  }: {
    canvasElement: HTMLElement;
  }) => {
    await fireEvent.click(getButton(canvasElement, "Mistake queue"));
    const canvas = within(canvasElement);
    await fireEvent.click(canvas.getAllByRole("button", {
      name: "Practice this"
    })[0]!);
    await clickFirstTwoCheckboxes(canvasElement);
    await fireEvent.click(getButton(canvasElement, "Check discard"));
    await expect(await canvas.findByRole("button", {
      name: "Draw another"
    })).toBeVisible();
    await fireEvent.click(getButton(canvasElement, "Draw another"));
    await expect(canvas.getByLabelText("Practice drill")).toBeVisible();

    // Exit deals a fresh authentic hand: the panel goes away and normal play resumes.
    await fireEvent.click(getButton(canvasElement, "Exit drill"));
    await expect(canvas.queryByLabelText("Practice drill")).toBeNull();
    await expect(getButton(canvasElement, "Deal")).toBeVisible();
    await expect(canvas.getByText("Practice ended — fresh hand dealt.")).toBeVisible();
  }
}`,...X.parameters?.docs?.source}}},Z.parameters={...Z.parameters,docs:{...Z.parameters?.docs,source:{originalSource:`{
  beforeEach: seedStoredTally(mistakeFixtures.createStraySweepTally),
  play: async ({
    canvasElement
  }: {
    canvasElement: HTMLElement;
  }) => {
    // Asserted before the write, or a fixture that never carried a stray would pass this story vacuously.
    await expect(localStorage.getItem(discardTallyKey)).toContain(STRAY_HAND_KEY);
    await clickFirstTwoCheckboxes(canvasElement);
    await within(canvasElement).findByRole("table");
    const swept = localStorage.getItem(discardTallyKey) ?? "";
    await expect(swept).not.toContain(STRAY_HAND_KEY);
    await expect(swept).toContain(DRILLED_HAND_KEY);
  }
}`,...Z.parameters?.docs?.source}}}})))()}$();export{x as AnalyticsAccepted,S as AnalyticsDisabled,q as ChangedManualEntryApplies,A as DealNewHandReplacesCards,k as DecisionQualityAllowedFromSettings,H as DeepLinkedAnalysisState,N as DiscardShowsScoredPossibilities,I as DoubleExpanded,F as Expanded,X as PracticeDrillFromMistakeQueue,Y as RecoverUnfinishedDecisions,U as SortAnalysisByPlayPoints,z as SortHandInAscendingOrder,R as SortHandInDealOrder,O as StoredConsentAcceptingTheUpdate,w as StoredConsentGiven,E as StoredConsentPredatingThePolicy,Z as SweepsStrayDrillRowsOnWrite,K as UnchangedManualEntryCloses,W as WithInitialCards,Q as __namedExportsOrder,v as default};