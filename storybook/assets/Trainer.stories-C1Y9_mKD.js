import{n as e}from"./rolldown-runtime-sJBDdmOt.js";import{t}from"./jsx-runtime-MKhVqBIO.js";import{c as n,l as r,o as i,u as ee}from"./Card-CHdb2ilR.js";import{n as te,t as a}from"./SortOrder-CEtbOzlr.js";import{n as ne,r as re,t as ie}from"./SortOrderName-CZNMd6op.js";import{a as ae,l as oe,n as se}from"./stories.common-B0RDaB3z.js";import{s as ce,t as le}from"./expectedCribPoints-8d5tp5A9.js";import{S as ue,T as de}from"./classifyMistake-CkFYR7nm.js";import{c as fe,f as pe,h as me,l as o}from"./mistakeQueue-C3fdpFYM.js";import{a as he,n as s,r as ge,t as _e}from"./MistakeQueueDialog.test.common-3jc1OdB5.js";import{a as ve,c as ye,d as be,f as xe,h as Se,i as Ce,m as we,n as Te,o as Ee,p as De,r as c,s as l,t as Oe,u}from"./randomNumberGenerator-ChdcHb1S.js";var d,f,p,m,h,g,_,v,y,b,x,S,C,w,T,E,D,O,k,A,j,M,N,P,F,I,L,R,z,B,V,H,U,W,G,K,q,J,Y,ke,X,Z,Q,Ae;function $(){return($=e((()=>{we(),te(),ae(),ee(),pe(),he(),ce(),de(),Ce(),Ee(),Te(),re(),d=t(),{expect:f,fireEvent:p,waitFor:m,within:h}=__STORYBOOK_MODULE_TEST__,g={argTypes:se(`sortOrder`,ie),args:{generateRandomNumber:Oe(`1`),loadGoogleAnalytics:()=>null,trackEvent:()=>null},beforeEach:()=>()=>{xe(),ve()},component:c,parameters:{layout:`fullscreen`},tags:[`autodocs`],title:`Trainer`},_=(e,t)=>h(e).getByRole(`button`,{name:t}),v=async(e,t)=>{await m(async()=>{await f(h(e).queryByText(`Loading analysis...`)).toBeNull()},{timeout:1e4}),await Promise.all(t.map(async t=>await f(h(e).getByRole(`columnheader`,{name:t})).toBeVisible()))},y={play:async({canvasElement:e})=>{let t=_(e,`Accept`);await p.click(t),await f(e).toHaveTextContent(`Thank you! Analytics cookies and card-free interaction measurements help us improve the site. For more details, please see our Privacy Policy.`)}},b={play:async({canvasElement:e})=>{let t=_(e,`Decline`);await p.click(t),await f(e).toHaveTextContent(`Analytics is disabled. Nothing is sent to Google Analytics. You can find more information in our Privacy Policy.`)}},x=(e,t)=>({play:t,render:({generateRandomNumber:t,loadGoogleAnalytics:n,trackEvent:r})=>(e(),(0,d.jsx)(c,{generateRandomNumber:t,loadGoogleAnalytics:n,trackEvent:r}))}),S=x(()=>Se(!0),async({canvasElement:e})=>{await m(async()=>{await f(h(e).getByText(`Privacy Policy`)).toBeVisible()},{timeout:1e3}),await f(h(e).queryByText(`Thank you!`)).not.toBeInTheDocument(),await f(h(e).getByRole(`button`,{name:`Analytics Settings`})).toBeVisible()}),C=()=>{localStorage.setItem(u,`true`)},w=x(C,async({canvasElement:e})=>{await f(e).toHaveTextContent(`Analytics Consent Update`),await p.click(_(e,`Decline`)),await f(e).not.toHaveTextContent(`Analytics Consent Update`),await f(localStorage.getItem(u)).toBe(`true`)}),T=()=>localStorage.getItem(`analyticsAcceptedMeasurements`)??``,E=x(C,async({canvasElement:e})=>{await p.click(_(e,`Accept`)),await f(T()).toContain(l),await f(e).not.toHaveTextContent(`Analytics Consent Update`)}),D=x(()=>{localStorage.setItem(u,`true`),localStorage.setItem(be,ye),localStorage.setItem(De,l)},async({canvasElement:e})=>{await p.click(_(e,`Analytics Settings`)),await p.click(_(e,`Allow decision-quality measurements`)),await f(T()).toContain(l)}),O={play:async({canvasElement:e})=>{let t=_(e,`Deal`),n=e.textContent;await p.click(t),await f(e.textContent).not.toEqual(n)}},k=e=>v(e,[`Hand`,`Crib`,`Play`,`Net`]),A=async e=>{let t=h(e).getAllByRole(`checkbox`);await p.click(t[0]),await p.click(t[1])},j={play:async({canvasElement:e})=>{await A(e),await k(e)}},M=(e=!1)=>async t=>{await j.play(t),await oe(t,{toggleStarterDetails:e})},N={...j,play:M()},P={...j,play:M(!0)},F=e=>async({canvasElement:t})=>{let n=h(t).getAllByRole(`radio`).find(t=>t.getAttribute(`value`)===ne(e)),r=t.textContent;await p.click(n),await f(t.textContent).not.toEqual(r),ve()},I={play:F(a.DealOrder)},L={play:F(a.Ascending)},R=r(i.SIX,n.SPADES),z=r(i.FIVE,n.HEARTS),B={args:{initialCards:[r(i.KING,n.HEARTS),r(i.QUEEN,n.SPADES),r(i.TEN,n.DIAMONDS),r(i.NINE,n.CLUBS),R,z],initialCribRole:le.Pone,initialDiscards:[R,z],initialScoreSortKey:ue.ExpectedHandPoints,initialSortOrder:a.DealOrder},play:async({canvasElement:e})=>{await f(h(e).getByText(`Pone`)).toBeVisible(),await k(e);let t=h(e).getByRole(`columnheader`,{name:/Hand/u});await f(t).toHaveAttribute(`aria-sort`,`descending`)}},V={play:async e=>{await j.play(e);let t=h(e.canvasElement).getByRole(`button`,{name:/^Play:/u});await p.click(t);let n=h(e.canvasElement).getByRole(`columnheader`,{name:/Play/u});await f(n).toHaveAttribute(`aria-sort`,`descending`)}},H={args:{initialCards:[r(i.ACE,n.SPADES),r(i.TWO,n.HEARTS),r(i.THREE,n.DIAMONDS),r(i.FOUR,n.CLUBS),r(i.FIVE,n.SPADES),r(i.SIX,n.HEARTS)]},play:async({canvasElement:e})=>{let t=h(e).getAllByRole(`checkbox`).map(e=>e.closest(`label`)?.textContent);await f(t).toEqual([`6♥`,`5♠`,`4♣`,`3♦`,`2♥`,`A♠`])}},U=e=>async({canvasElement:t})=>{let n=h(t);await p.click(_(t,`Enter cards`)),e&&(await p.click(n.getByRole(`button`,{name:e[0],pressed:!0})),await p.click(n.getByRole(`button`,{name:e[1]}))),await p.click(_(t,`Use hand`)),await f(n.queryByRole(`heading`,{name:`Enter cards`})).not.toBeInTheDocument()},W={args:H.args,play:U()},G={args:H.args,play:U([`A♠`,`A♣`])},K=e=>()=>(localStorage.setItem(o,JSON.stringify(e())),()=>{localStorage.removeItem(o)}),q={beforeEach:K(()=>{let e=s.createSampleMistakeTally();return{...e,records:e.records.map(e=>({...e,recordedAdmission:`pending`}))}}),play:async({canvasElement:e})=>{await m(async()=>{await f(me().records.map(e=>e.recordedAdmission)).toEqual([...Array.from({length:3},()=>({basis:`exact-fallback-v1`,eligible:!0})),{basis:`exact-v1`,eligible:!1}])}),await p.click(_(e,`Mistake queue`)),await f(h(e).getByRole(`heading`,{name:`Mistake queue`})).toBeVisible()}},J={beforeEach:K(s.createSampleMistakeTally),play:async({canvasElement:e})=>{await p.click(_(e,`Mistake queue`));let t=h(e);await p.click(t.getAllByRole(`button`,{name:`Practice this`})[0]),await A(e),await p.click(_(e,`Check discard`)),await f(await t.findByRole(`button`,{name:`Draw another`})).toBeVisible(),await p.click(_(e,`Draw another`)),await f(t.getByLabelText(`Practice drill`)).toBeVisible(),await p.click(_(e,`Exit drill`)),await f(t.queryByLabelText(`Practice drill`)).toBeNull(),await f(_(e,`Deal`)).toBeVisible(),await f(t.getByText(`Practice ended — fresh hand dealt.`)).toBeVisible()}},Y={beforeEach:K(s.createStraySweepTally),play:async({canvasElement:e})=>{await f(localStorage.getItem(o)).toContain(ge),await A(e),await h(e).findByRole(`table`);let t=localStorage.getItem(o)??``;await f(t).not.toContain(ge),await f(t).toContain(_e)}},ke=`Your first discard counted. Changes now are practice.`,X=async(e,t)=>{await p.click(h(e).getAllByRole(`checkbox`)[t])},Z=async(e,t)=>{await f(h(e).queryByText(ke)!==null).toBe(t)},Q={beforeEach:()=>(fe(),fe),play:async e=>{let{canvasElement:t}=e;await j.play(e),await Z(t,!1),await X(t,0),await Z(t,!0),await X(t,2),await k(t),await Z(t,!0),await p.click(_(t,`Deal`)),await Z(t,!1)}},Ae=[`AnalyticsAccepted`,`AnalyticsDisabled`,`StoredConsentGiven`,`StoredConsentPredatingThePolicy`,`StoredConsentAcceptingTheUpdate`,`DecisionQualityAllowedFromSettings`,`DealNewHandReplacesCards`,`DiscardShowsScoredPossibilities`,`Expanded`,`DoubleExpanded`,`SortHandInDealOrder`,`SortHandInAscendingOrder`,`DeepLinkedAnalysisState`,`SortAnalysisByPlayPoints`,`WithInitialCards`,`UnchangedManualEntryCloses`,`ChangedManualEntryApplies`,`RecoverUnfinishedDecisions`,`PracticeDrillFromMistakeQueue`,`SweepsStrayDrillRowsOnWrite`,`ReviseCountedDiscardNote`],y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  play: async ({
    canvasElement
  }: {
    canvasElement: HTMLElement;
  }) => {
    const acceptButton = getButton(canvasElement, "Accept");
    await fireEvent.click(acceptButton);
    await expect(canvasElement).toHaveTextContent("Thank you! Analytics cookies and card-free interaction measurements help us improve the site. For more details, please see our Privacy Policy.");
  }
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  play: async ({
    canvasElement
  }: {
    canvasElement: HTMLElement;
  }) => {
    const declineButton = getButton(canvasElement, "Decline");
    await fireEvent.click(declineButton);
    await expect(canvasElement).toHaveTextContent("Analytics is disabled. Nothing is sent to Google Analytics. You can find more information in our Privacy Policy.");
  }
}`,...b.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`createStoredChoiceStory(() => storeAnalyticsChoice(true), async ({
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
})`,...S.parameters?.docs?.source}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`createStoredChoiceStory(seedConsentPredatingThePolicy, async ({
  canvasElement
}) => {
  await expect(canvasElement).toHaveTextContent("Analytics Consent Update");
  await fireEvent.click(getButton(canvasElement, "Decline"));
  await expect(canvasElement).not.toHaveTextContent("Analytics Consent Update");
  await expect(localStorage.getItem(analyticsConsentKey)).toBe("true");
})`,...w.parameters?.docs?.source}}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`createStoredChoiceStory(seedConsentPredatingThePolicy, async ({
  canvasElement
}) => {
  await fireEvent.click(getButton(canvasElement, "Accept"));
  await expect(grantedMeasurements()).toContain(DECISION_QUALITY_MEASUREMENT);
  await expect(canvasElement).not.toHaveTextContent("Analytics Consent Update");
})`,...E.parameters?.docs?.source}}},D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`createStoredChoiceStory(() => {
  localStorage.setItem(analyticsConsentKey, "true");
  localStorage.setItem(answeredPolicyVersionKey, PRIVACY_POLICY_VERSION);
  localStorage.setItem(declinedMeasurementsKey, DECISION_QUALITY_MEASUREMENT);
}, async ({
  canvasElement
}) => {
  await fireEvent.click(getButton(canvasElement, "Analytics Settings"));
  await fireEvent.click(getButton(canvasElement, "Allow decision-quality measurements"));
  await expect(grantedMeasurements()).toContain(DECISION_QUALITY_MEASUREMENT);
})`,...D.parameters?.docs?.source}}},O.parameters={...O.parameters,docs:{...O.parameters?.docs,source:{originalSource:`{
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
}`,...O.parameters?.docs?.source}}},j.parameters={...j.parameters,docs:{...j.parameters?.docs,source:{originalSource:`{
  play: async ({
    canvasElement
  }: {
    canvasElement: HTMLElement;
  }) => {
    await clickFirstTwoCheckboxes(canvasElement);
    await expectAnalysisColumnHeaders(canvasElement);
  }
}`,...j.parameters?.docs?.source}}},N.parameters={...N.parameters,docs:{...N.parameters?.docs,source:{originalSource:`{
  ...DiscardShowsScoredPossibilities,
  play: playTrainerToggle()
}`,...N.parameters?.docs?.source}}},P.parameters={...P.parameters,docs:{...P.parameters?.docs,source:{originalSource:`{
  ...DiscardShowsScoredPossibilities,
  play: playTrainerToggle(true)
}`,...P.parameters?.docs?.source}}},I.parameters={...I.parameters,docs:{...I.parameters?.docs,source:{originalSource:`{
  play: createPlay(SortOrder.DealOrder)
}`,...I.parameters?.docs?.source}}},L.parameters={...L.parameters,docs:{...L.parameters?.docs,source:{originalSource:`{
  play: createPlay(SortOrder.Ascending)
}`,...L.parameters?.docs?.source}}},B.parameters={...B.parameters,docs:{...B.parameters?.docs,source:{originalSource:`{
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
}`,...B.parameters?.docs?.source}}},V.parameters={...V.parameters,docs:{...V.parameters?.docs,source:{originalSource:`{
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
}`,...V.parameters?.docs?.source}}},H.parameters={...H.parameters,docs:{...H.parameters?.docs,source:{originalSource:`{
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
}`,...H.parameters?.docs?.source}}},W.parameters={...W.parameters,docs:{...W.parameters?.docs,source:{originalSource:`{
  args: WithInitialCards.args,
  play: createManualEntryPlay()
}`,...W.parameters?.docs?.source}}},G.parameters={...G.parameters,docs:{...G.parameters?.docs,source:{originalSource:`{
  args: WithInitialCards.args,
  play: createManualEntryPlay(["A♠", "A♣"])
}`,...G.parameters?.docs?.source}}},q.parameters={...q.parameters,docs:{...q.parameters?.docs,source:{originalSource:`{
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
}`,...q.parameters?.docs?.source}}},J.parameters={...J.parameters,docs:{...J.parameters?.docs,source:{originalSource:`{
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
}`,...J.parameters?.docs?.source}}},Y.parameters={...Y.parameters,docs:{...Y.parameters?.docs,source:{originalSource:`{
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
}`,...Y.parameters?.docs?.source}}},Q.parameters={...Q.parameters,docs:{...Q.parameters?.docs,source:{originalSource:`{
  beforeEach: () => {
    clearDiscardTally();
    return clearDiscardTally;
  },
  play: async (context: {
    canvasElement: HTMLElement;
  }) => {
    const {
      canvasElement
    } = context;
    await DiscardShowsScoredPossibilities.play(context);
    await expectRevisedNoteVisibility(canvasElement, false);
    await clickHandCheckbox(canvasElement, 0);
    await expectRevisedNoteVisibility(canvasElement, true);
    await clickHandCheckbox(canvasElement, 2);
    await expectAnalysisColumnHeaders(canvasElement);
    await expectRevisedNoteVisibility(canvasElement, true);
    await fireEvent.click(getButton(canvasElement, "Deal"));
    await expectRevisedNoteVisibility(canvasElement, false);
  }
}`,...Q.parameters?.docs?.source}}}})))()}$();export{y as AnalyticsAccepted,b as AnalyticsDisabled,G as ChangedManualEntryApplies,O as DealNewHandReplacesCards,D as DecisionQualityAllowedFromSettings,B as DeepLinkedAnalysisState,j as DiscardShowsScoredPossibilities,P as DoubleExpanded,N as Expanded,J as PracticeDrillFromMistakeQueue,q as RecoverUnfinishedDecisions,Q as ReviseCountedDiscardNote,V as SortAnalysisByPlayPoints,L as SortHandInAscendingOrder,I as SortHandInDealOrder,E as StoredConsentAcceptingTheUpdate,S as StoredConsentGiven,w as StoredConsentPredatingThePolicy,Y as SweepsStrayDrillRowsOnWrite,W as UnchangedManualEntryCloses,H as WithInitialCards,Ae as __namedExportsOrder,g as default};