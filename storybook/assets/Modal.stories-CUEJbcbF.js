import{n as e}from"./rolldown-runtime-DkW27tQK.js";import{t}from"./react-Q1GcV6wX.js";import{t as n}from"./jsx-runtime-DeHZSEgm.js";import{n as r,t as i}from"./Modal-7Ntz1Uz7.js";import{n as a,t as o}from"./PrivacyPolicy-DEKrtU4-.js";var s,c,l,u,d,f,p,m,h,g;function _(){return(_=e((()=>{r(),a(),s=t(),c=n(),{expect:l,fireEvent:u}=__STORYBOOK_MODULE_TEST__,d={component:i,parameters:{layout:`fullscreen`},tags:[`autodocs`],title:`Modal`},f={args:{children:(0,c.jsx)(`p`,{children:`Sample modal content.`}),onClose:()=>null,show:!0},decorators:[e=>(0,c.jsx)(`div`,{style:{minHeight:`300px`,position:`relative`},children:(0,c.jsx)(e,{})})]},p={children:(0,c.jsx)(o,{}),onClose:()=>null,show:!0},m={args:p,play:async({canvasElement:e})=>{await l(e).toHaveTextContent(`Privacy Policy for Cribbage Trainer`)}},h={args:p,play:async({canvasElement:e})=>{let t=e.querySelector(`button`);await u.click(t),await l(e).not.toHaveTextContent(`Privacy Policy for Cribbage Trainer`)},render:()=>{let[e,t]=(0,s.useState)(!0);return(0,c.jsx)(i,{onClose:()=>t(!1),show:e,children:(0,c.jsx)(o,{})})}},g=[`Default`,`ShownPrivacyPolicy`,`ClosedPrivacyPolicy`],f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
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
}`,...f.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  args: privacyPolicyArgs,
  play: async ({
    canvasElement
  }) => {
    await expect(canvasElement).toHaveTextContent("Privacy Policy for Cribbage Trainer");
  }
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
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
}`,...h.parameters?.docs?.source}}}})))()}_();export{h as ClosedPrivacyPolicy,f as Default,m as ShownPrivacyPolicy,g as __namedExportsOrder,d as default};