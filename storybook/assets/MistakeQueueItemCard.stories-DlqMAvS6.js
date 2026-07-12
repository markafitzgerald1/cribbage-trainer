import{n as e}from"./rolldown-runtime-sJBDdmOt.js";import{n as t,t as n}from"./SortOrder-CEtbOzlr.js";import{a as r,i,t as a}from"./stories.common-ClFJeHpz.js";import{i as o,t as s}from"./tableIdentity-D6QBagum.js";import{a as c,i as l,o as u,s as d}from"./mistakeQueue.test.common-DZ-RbY_E.js";import{n as f,t as p}from"./MistakeQueueItemCard-Cotk13EC.js";var m,h,g,_,v,y,b,x,S,C,w,T,E,D,O,k;function A(){return(A=e((()=>{r(),l(),f(),t(),s(),{expect:m,fn:h,userEvent:g,within:_}=__STORYBOOK_MODULE_TEST__,v={args:{item:c,onPractice:h(),sortOrder:n.DealOrder},component:p,parameters:{layout:`centered`},tags:[`autodocs`],title:`MistakeQueueItemCard`},y={play:async({args:e,canvasElement:t})=>{await a(t,`Practice this`,e.onPractice)}},b={args:{item:{...c,consecutiveSuccesses:2,isMastered:!0,lossQuantile:`high`}},play:async({canvasElement:e})=>{await i(e,`Mastered`)}},x={args:{item:{...c,lossQuantile:null,previousDiscard:null}},play:async({canvasElement:e})=>{await i(e,`Previous choice not recorded`)}},S={args:{lossReason:`Crib`},play:async({canvasElement:e})=>{await i(e,`Current-table comparison: Crib`)}},C={args:{classification:d,item:u},play:async({canvasElement:e})=>{let t=_(e),n=t.getByRole(`note`,{name:`Previous discard cost 1.00 points lost as dealer, 0.00 as pone`});await m(n).toBeVisible(),await m(n).toHaveTextContent(`1.00 dealer, 0.00 pone`),await m(t.getByText(`Current-table comparison: Crib gain < Hand loss`)).toBeVisible(),await m(Array.from(n.parentElement?.children??[],e=>e.textContent)).toEqual([`Dealer`,`medium`,`Recorded cost: 1.00 points`,`Current-table comparison: Crib gain < Hand loss`,`1.00 dealer, 0.00 pone`])}},w={args:{classification:d},play:async({canvasElement:e})=>{let t=_(e).getByRole(`note`,{name:`Current-table comparison: 1.30 Crib gain does not cover 1.40 Hand loss`});await m(t).toBeVisible(),await m(t).toHaveTextContent(`Current-table comparison: Crib gain < Hand loss`),await m(t).toHaveAttribute(`title`,`Current-table comparison (0.10 pts lost): 1.30 Crib gain does not cover 1.40 Hand loss`)}},T={args:{item:{...c,tableIdentity:o}},play:async({canvasElement:e})=>{let t=_(e);await m(t.getByRole(`note`,{name:`Recorded cost: 1.00 points`})).toBeVisible(),await g.click(t.getByText(`Judged with current tables`)),await m(t.getByText(`Table fingerprints (for bug reports)`)).toBeVisible(),await Promise.all([{digest:o.crib.means_sha256,role:`Crib`},{digest:o.play.means_sha256,role:`Play`}].map(async({role:e,digest:n})=>{let r=n.slice(0,12),i=t.getByRole(`note`,{name:`${e} table fingerprint ${r}`});await m(i).toBeVisible(),await m(i).toHaveTextContent(`${e}: ${r}…`),await m(i).toHaveAttribute(`title`,n)}))}},E={args:{item:{...c,tableIdentity:{crib:{means_sha256:`a`.repeat(64)},play:{means_sha256:`b`.repeat(64)}}}},play:async({canvasElement:e})=>{let t=_(e);await g.click(t.getByText(`Judged with different tables`));let n=t.getByRole(`note`,{name:`Play table fingerprint ${`b`.repeat(12)}`});await m(n).toHaveTextContent(`Play: ${`b`.repeat(12)}…`),await m(n).toHaveAttribute(`title`,`b`.repeat(64))}},D={args:{item:{...c,previousDiscardLoss:.004}},play:async({canvasElement:e})=>{let t=_(e);await m(t.getByRole(`note`,{name:`Recorded cost: less than 0.01 points`})).toBeVisible(),await m(t.getByRole(`note`,{name:`Recorded cost: less than 0.01 points`})).toHaveTextContent(`Recorded cost: < 0.01 points`)}},O={args:{item:{...c,lossIfWrong:3.18,previousDiscardLoss:3.08,wrong:3}},play:async({canvasElement:e})=>{let t=_(e).getByRole(`note`,{name:`Average over 3 wrong attempts: 3.18 points`});await m(t).toHaveTextContent(`Average over 3 wrong attempts: 3.18 points`),await m(_(t).getByText(`3.18 points`)).toHaveStyle({whiteSpace:`nowrap`}),await m(_(e).getByRole(`note`,{name:`Recorded cost: 3.08 points`})).toHaveStyle({whiteSpace:`nowrap`})}},k=[`Active`,`Mastered`,`WithoutPreviousDiscard`,`WithLossReason`,`WithRoleLossPair`,`WithClassification`,`CurrentTables`,`EarlierTables`,`SubCentRecordedCost`,`WithWrongRetries`],y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  play: async ({
    args,
    canvasElement
  }) => {
    await clickStoryButtonExpectingCall(canvasElement, "Practice this", args.onPractice);
  }
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  args: {
    item: {
      ...mockItemA,
      consecutiveSuccesses: 2,
      isMastered: true,
      lossQuantile: "high"
    }
  },
  play: async ({
    canvasElement
  }) => {
    await expectStoryTextVisible(canvasElement, "Mastered");
  }
}`,...b.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  args: {
    item: {
      ...mockItemA,
      lossQuantile: null,
      previousDiscard: null
    }
  },
  play: async ({
    canvasElement
  }) => {
    await expectStoryTextVisible(canvasElement, "Previous choice not recorded");
  }
}`,...x.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  args: {
    lossReason: "Crib"
  },
  play: async ({
    canvasElement
  }) => {
    await expectStoryTextVisible(canvasElement, "Current-table comparison: Crib");
  }
}`,...S.parameters?.docs?.source}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  args: {
    classification: mockTradeOffClassification,
    item: mockItemWithRoleLossPair
  },
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    const pair = canvas.getByRole("note", {
      name: "Previous discard cost 1.00 points lost as dealer, 0.00 as pone"
    });
    await expect(pair).toBeVisible();
    await expect(pair).toHaveTextContent("1.00 dealer, 0.00 pone");
    await expect(canvas.getByText("Current-table comparison: Crib gain < Hand loss")).toBeVisible();
    await expect(Array.from(pair.parentElement?.children ?? [], badge => badge.textContent)).toEqual(["Dealer", "medium", "Recorded cost: 1.00 points", "Current-table comparison: Crib gain < Hand loss", "1.00 dealer, 0.00 pone"]);
  }
}`,...C.parameters?.docs?.source}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  args: {
    classification: mockTradeOffClassification
  },
  play: async ({
    canvasElement
  }) => {
    const badge = within(canvasElement).getByRole("note", {
      name: "Current-table comparison: 1.30 Crib gain does not cover 1.40 Hand loss"
    });
    await expect(badge).toBeVisible();
    await expect(badge).toHaveTextContent("Current-table comparison: Crib gain < Hand loss");
    await expect(badge).toHaveAttribute("title", "Current-table comparison (0.10 pts lost): 1.30 Crib gain does not cover 1.40 Hand loss");
  }
}`,...w.parameters?.docs?.source}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  args: {
    item: {
      ...mockItemA,
      tableIdentity: shippedTableIdentity
    }
  },
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("note", {
      name: "Recorded cost: 1.00 points"
    })).toBeVisible();
    await userEvent.click(canvas.getByText("Judged with current tables"));
    await expect(canvas.getByText("Table fingerprints (for bug reports)")).toBeVisible();
    await Promise.all([{
      digest: shippedTableIdentity.crib.means_sha256,
      role: "Crib"
    }, {
      digest: shippedTableIdentity.play.means_sha256,
      role: "Play"
    }].map(async ({
      role,
      digest
    }) => {
      const preview = digest.slice(0, 12);
      const fingerprint = canvas.getByRole("note", {
        name: \`\${role} table fingerprint \${preview}\`
      });
      await expect(fingerprint).toBeVisible();
      await expect(fingerprint).toHaveTextContent(\`\${role}: \${preview}…\`);
      await expect(fingerprint).toHaveAttribute("title", digest);
    }));
  }
}`,...T.parameters?.docs?.source}}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  args: {
    item: {
      ...mockItemA,
      tableIdentity: {
        crib: {
          means_sha256: "a".repeat(64)
        },
        play: {
          means_sha256: "b".repeat(64)
        }
      }
    }
  },
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByText("Judged with different tables"));
    const fingerprint = canvas.getByRole("note", {
      name: \`Play table fingerprint \${"b".repeat(12)}\`
    });
    await expect(fingerprint).toHaveTextContent(\`Play: \${"b".repeat(12)}…\`);
    await expect(fingerprint).toHaveAttribute("title", "b".repeat(64));
  }
}`,...E.parameters?.docs?.source}}},D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
  args: {
    item: {
      ...mockItemA,
      previousDiscardLoss: 0.004
    }
  },
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("note", {
      name: "Recorded cost: less than 0.01 points"
    })).toBeVisible();
    await expect(canvas.getByRole("note", {
      name: "Recorded cost: less than 0.01 points"
    })).toHaveTextContent("Recorded cost: < 0.01 points");
  }
}`,...D.parameters?.docs?.source}}},O.parameters={...O.parameters,docs:{...O.parameters?.docs,source:{originalSource:`{
  args: {
    item: {
      ...mockItemA,
      lossIfWrong: 3.18,
      previousDiscardLoss: 3.08,
      wrong: 3
    }
  },
  play: async ({
    canvasElement
  }) => {
    const average = within(canvasElement).getByRole("note", {
      name: "Average over 3 wrong attempts: 3.18 points"
    });
    await expect(average).toHaveTextContent("Average over 3 wrong attempts: 3.18 points");
    await expect(within(average).getByText("3.18 points")).toHaveStyle({
      whiteSpace: "nowrap"
    });
    await expect(within(canvasElement).getByRole("note", {
      name: "Recorded cost: 3.08 points"
    })).toHaveStyle({
      whiteSpace: "nowrap"
    });
  }
}`,...O.parameters?.docs?.source}}}})))()}A();export{y as Active,T as CurrentTables,E as EarlierTables,b as Mastered,D as SubCentRecordedCost,w as WithClassification,S as WithLossReason,C as WithRoleLossPair,O as WithWrongRetries,x as WithoutPreviousDiscard,k as __namedExportsOrder,v as default};