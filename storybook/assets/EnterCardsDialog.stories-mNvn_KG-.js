import{i as e}from"./preload-helper-CT_b8DTk.js";import{a as t,d as n}from"./CardLabel-BhZER6fd.js";import{i as r,r as i}from"./SortOrderName-BuMtj5pl.js";import{o as a,t as o}from"./expectedCribPoints-DNklQyfF.js";import{n as s,t as c}from"./EnterCardsDialog--GEnFrsJ.js";var l,u,d,f,p,m,h,g,_,v;e((()=>{a(),n(),s(),r(),{expect:l,fn:u,userEvent:d,within:f}=__STORYBOOK_MODULE_TEST__,p={args:{initialCards:t.slice(0,6),initialCribRole:o.Dealer,onClose:u(),onSubmit:u(),show:!0,sortOrder:i.Descending},component:c,tags:[`autodocs`],title:`EnterCardsDialog`},m={},h={play:async({canvasElement:e})=>{let t=f(e);await d.click(t.getByRole(`button`,{name:`Clear`})),await l(t.getByText(`0 of 6`)).toBeInTheDocument(),await l(t.getByRole(`button`,{name:`Clear`})).toBeDisabled(),await l(t.getByRole(`button`,{name:`Use hand`})).toBeDisabled()}},g={play:async({args:e,canvasElement:n})=>{let r=f(n),i=r.getByRole(`button`,{name:`A♣`,pressed:!0});await d.click(i),await l(i).toHaveAttribute(`aria-pressed`,`false`),await d.click(r.getByRole(`button`,{name:`7♣`})),await d.click(r.getByRole(`radio`,{name:`Pone`})),await d.click(r.getByRole(`button`,{name:`Use hand`})),await l(e.onSubmit).toHaveBeenCalledWith([...t.slice(1,6),t[6]],o.Pone)}},_={play:async({args:e})=>{await d.keyboard(`x`),await l(e.onClose).not.toHaveBeenCalled(),await d.keyboard(`{Escape}`),await l(e.onClose).toHaveBeenCalledTimes(1)}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
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
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
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
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  play: async ({
    args
  }) => {
    await userEvent.keyboard("x");
    await expect(args.onClose).not.toHaveBeenCalled();
    await userEvent.keyboard("{Escape}");
    await expect(args.onClose).toHaveBeenCalledTimes(1);
  }
}`,..._.parameters?.docs?.source}}},v=[`ReadyToEdit`,`ClearCards`,`EditAndUseHand`,`DismissWithEscape`]}))();export{h as ClearCards,_ as DismissWithEscape,g as EditAndUseHand,m as ReadyToEdit,v as __namedExportsOrder,p as default};