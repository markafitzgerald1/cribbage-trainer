import{i as e}from"./preload-helper-BdFrVu1K.js";import{i as t,u as n}from"./Card-CIXpfrUA.js";import{a as r,i}from"./SortOrderName-MXRr2nWr.js";import{a,r as o}from"./stories.common-B0_Wn-EV.js";import{o as s,t as c}from"./expectedCribPoints-vR0MW9Bt.js";import{n as l,t as u}from"./EnterCardsDialog-CAlnhxHI.js";var d,f,p,m,h,g,_,v,y,b;e((()=>{s(),n(),l(),r(),o(),{expect:d,fn:f,userEvent:p,within:m}=__STORYBOOK_MODULE_TEST__,h={args:{initialCards:t.slice(0,6),initialCribRole:c.Dealer,onClose:f(),onSubmit:f(),show:!0,sortOrder:i.Descending},component:u,tags:[`autodocs`],title:`EnterCardsDialog`},g={},_={play:async({canvasElement:e})=>{let t=m(e);await p.click(t.getByRole(`button`,{name:`Clear`})),await d(t.getByText(`0 of 6`)).toBeInTheDocument(),await d(t.getByRole(`button`,{name:`Clear`})).toBeDisabled(),await d(t.getByRole(`button`,{name:`Use hand`})).toBeDisabled()}},v={play:async({args:e,canvasElement:n})=>{let r=m(n),i=r.getByRole(`button`,{name:`A♣`,pressed:!0});await p.click(i),await d(i).toHaveAttribute(`aria-pressed`,`false`),await p.click(r.getByRole(`button`,{name:`7♣`})),await p.click(r.getByRole(`radio`,{name:`Pone`})),await p.click(r.getByRole(`button`,{name:`Use hand`})),await d(e.onSubmit).toHaveBeenCalledWith([...t.slice(1,6),t[6]],c.Pone)}},y={play:a},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", {
      name: "Clear"
    }));
    await expect(canvas.getByText("0 of 6")).toBeInTheDocument();
    await expect(canvas.getByRole("button", {
      name: "Clear"
    })).toBeDisabled();
    await expect(canvas.getByRole("button", {
      name: "Use hand"
    })).toBeDisabled();
  }
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  play: async ({
    args,
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    const selectedAce = canvas.getByRole("button", {
      name: "A♣",
      pressed: true
    });
    await userEvent.click(selectedAce);
    await expect(selectedAce).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(canvas.getByRole("button", {
      name: "7♣"
    }));
    await userEvent.click(canvas.getByRole("radio", {
      name: "Pone"
    }));
    await userEvent.click(canvas.getByRole("button", {
      name: "Use hand"
    }));
    await expect(args.onSubmit).toHaveBeenCalledWith([...DECK.slice(1, 6), DECK[6]], CribRole.Pone);
  }
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  play: playStoryEscape
}`,...y.parameters?.docs?.source}}},b=[`ReadyToEdit`,`ClearCards`,`EditAndUseHand`,`DismissWithEscape`]}))();export{_ as ClearCards,y as DismissWithEscape,v as EditAndUseHand,g as ReadyToEdit,b as __namedExportsOrder,h as default};