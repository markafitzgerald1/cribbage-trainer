import{i as e,s as t}from"./preload-helper-BdFrVu1K.js";import{t as n}from"./react-uS7UyY4Q.js";import{t as r}from"./jsx-runtime-f3rHp9ZU.js";import{n as i,t as a}from"./Modal-Bte0Sk32.js";import{n as o,t as s}from"./PrivacyPolicy-Di4vHLkq.js";var c,l,u,d,f,p,m,h,g,_;e((()=>{i(),o(),c=t(n()),l=r(),{expect:u,fireEvent:d}=__STORYBOOK_MODULE_TEST__,f={component:a,parameters:{layout:`fullscreen`},tags:[`autodocs`],title:`Modal`},p={args:{children:(0,l.jsx)(`p`,{children:`Sample modal content.`}),onClose:()=>null,show:!0},decorators:[e=>(0,l.jsx)(`div`,{style:{minHeight:`300px`,position:`relative`},children:(0,l.jsx)(e,{})})]},m={children:(0,l.jsx)(s,{}),onClose:()=>null,show:!0},h={args:m,play:async({canvasElement:e})=>{await u(e).toHaveTextContent(`Privacy Policy for Cribbage Trainer`)}},g={args:m,play:async({canvasElement:e})=>{let t=e.querySelector(`button`);await d.click(t),await u(e).not.toHaveTextContent(`Privacy Policy for Cribbage Trainer`)},render:()=>{let[e,t]=(0,c.useState)(!0);return(0,l.jsx)(a,{onClose:()=>t(!1),show:e,children:(0,l.jsx)(s,{})})}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  args: {
    children: <p>Sample modal content.</p>,
    onClose: () => null,
    show: true
  },
  decorators: [Story => <div style={{
    minHeight: "300px",
    position: "relative"
  }}>
        <Story />
      </div>]
}`,...p.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  args: privacyPolicyArgs,
  play: async ({
    canvasElement
  }) => {
    await expect(canvasElement).toHaveTextContent("Privacy Policy for Cribbage Trainer");
  }
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  args: privacyPolicyArgs,
  play: async ({
    canvasElement
  }) => {
    const closeButton = canvasElement.querySelector("button");
    await fireEvent.click(closeButton!);
    await expect(canvasElement).not.toHaveTextContent("Privacy Policy for Cribbage Trainer");
  },
  render: () => {
    const [show, setShow] = useState(true);
    return <Modal onClose={() => setShow(false)} show={show}>
        <PrivacyPolicyNode />
      </Modal>;
  }
}`,...g.parameters?.docs?.source}}},_=[`Default`,`ShownPrivacyPolicy`,`ClosedPrivacyPolicy`]}))();export{g as ClosedPrivacyPolicy,p as Default,h as ShownPrivacyPolicy,_ as __namedExportsOrder,f as default};