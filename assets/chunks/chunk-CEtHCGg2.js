import{kn as e}from"./chunk-DCq2tb4F.js";import{t}from"./chunk-CDRG_CNZ2.js";var n=e(),r=`/assets/static/lecture3_pic1.BjHHXQTL.png`,i=`/assets/static/lecture3_pic2.B-X9gjjr.png`,a=`/assets/static/lecture3_pic3.BRdU7fr8.png`,o=`/assets/static/lecture3_pic4.TLFQv1eA.png`,s={author:[`fretchen`,`Selim Jochim`],order:3,title:`Lecture 3 - The two-level system`};function c(e){let s={a:`a`,code:`code`,em:`em`,h2:`h2`,h3:`h3`,li:`li`,ol:`ol`,p:`p`,pre:`pre`,section:`section`,strong:`strong`,sup:`sup`,ul:`ul`,...e.components};return(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)(s.p,{children:`We are going to discuss the two-level system, it's static properties
like level splitting at avoided crossings and dynamical properties like
Rabi oscillations.`}),`
`,(0,n.jsxs)(s.p,{children:[`After the previous discussions of some basic cooking recipes to quantum
mechanics in last weeks lectures, we will use them to understand the two-level system. A very detailled
discussion can be found in chapter 4 of Ref. `,(0,n.jsx)(s.sup,{children:(0,n.jsx)(s.a,{href:`#user-content-fn-ct1`,id:`user-content-fnref-ct1`,"data-footnote-ref":!0,"aria-describedby":`footnote-label`,children:`1`})}),`. The importance of the
two-level system is at least three-fold:`]}),`
`,(0,n.jsxs)(s.ol,{children:[`
`,(0,n.jsxs)(s.li,{children:[`
`,(0,n.jsx)(s.p,{children:`It is the simplest system of quantum mechanics as it spans a Hilbert
space of only two states.`}),`
`]}),`
`,(0,n.jsxs)(s.li,{children:[`
`,(0,n.jsx)(s.p,{children:`It is quite ubiquitous in nature and very widely used in atomic
physics.`}),`
`]}),`
`,(0,n.jsxs)(s.li,{children:[`
`,(0,n.jsx)(s.p,{children:`The two-level system is another word for the qubit, which is the
fundamental building block of the exploding field of quantum
computing and quantum information science.`}),`
`]}),`
`]}),`
`,(0,n.jsx)(t,{id:`fig-two-level-examples`,href:r,alt:`Examples for two-state systems: a) Benzene, b) Ammonia, c) Molecular ion`,caption:`Examples for two-state systems. a) Benzene: In the ground state, the electrons are delocalized. b) Ammonia: The nitrogen atom is either found above or below the hydrogen triangle. The state changes when the nitrogen atom tunnels. c) Molecular ion: The electron is either localized near proton 1 or 2.`}),`
`,(0,n.jsx)(s.p,{children:`Some of the many examples for two-level systems that can be found in
nature:`}),`
`,(0,n.jsxs)(s.ul,{children:[`
`,(0,n.jsxs)(s.li,{children:[`
`,(0,n.jsx)(s.p,{children:`Spin of the electron: Up vs. down state`}),`
`]}),`
`,(0,n.jsxs)(s.li,{children:[`
`,(0,n.jsx)(s.p,{children:`Two-level atom with one electron (simplified): Excited vs. ground
state`}),`
`]}),`
`,(0,n.jsxs)(s.li,{children:[`
`,(0,n.jsxs)(s.p,{children:[`Structures of molecules, e.g., `,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`NH_3`})]}),`
`]}),`
`,(0,n.jsxs)(s.li,{children:[`
`,(0,n.jsx)(s.p,{children:`Occupation of mesoscopic capacitors in nanodevices.`}),`
`]}),`
`,(0,n.jsxs)(s.li,{children:[`
`,(0,n.jsx)(s.p,{children:`Current states in superconducting loops.`}),`
`]}),`
`,(0,n.jsxs)(s.li,{children:[`
`,(0,n.jsx)(s.p,{children:`Nitrogen-vacancy centers in diamond.`}),`
`]}),`
`]}),`
`,(0,n.jsx)(s.h2,{children:`Hamiltonian, Eigenstates and Matrix Notation`}),`
`,(0,n.jsxs)(s.p,{children:[`To start out, we will consider two eigenstates
`,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`\\left|0\\right\\rangle`}),`, `,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`\\left|1\\right\\rangle`}),`
of the Hamiltonian `,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`\\hat{H}_0`}),` with`]}),`
`,(0,n.jsx)(s.pre,{children:(0,n.jsx)(s.code,{className:`language-math math-display`,children:` \\hat{H}_0\\left|0\\right\\rangle=E_0\\left|0\\right\\rangle, \\qquad \\hat{H}_0\\left|1\\right\\rangle=E_1\\left|1\\right\\rangle.`})}),`
`,(0,n.jsx)(s.p,{children:`Quite typically we might think of it as a two-level atom
with states 1 and 2. The eigenstates can be expressed in matrix
notation:`}),`
`,(0,n.jsx)(s.pre,{children:(0,n.jsx)(s.code,{className:`language-math math-display`,children:` \\left|0\\right\\rangle=\\left( \\begin{array}{c} 1 \\\\ 0 \\end{array} \\right), \\qquad \\left|1\\right\\rangle=\\left( \\begin{array}{c} 0 \\\\ 1 \\end{array} \\right),`})}),`
`,(0,n.jsxs)(s.p,{children:[`so that `,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`\\hat{H}_0`}),` be written as a diagonal matrix`]}),`
`,(0,n.jsx)(s.pre,{children:(0,n.jsx)(s.code,{className:`language-math math-display`,children:`    \\hat{H}_0 = \\left(\\begin{array}{cc} E_0 & 0 \\\\ 0 & E_1 \\end{array}\\right).`})}),`
`,(0,n.jsxs)(s.p,{children:[`If we would only prepare eigenstates the system would be
rather boring. However, we typically have the ability to change the
Hamiltonian by switching on and off laser or microwave fields `,(0,n.jsx)(s.sup,{children:(0,n.jsx)(s.a,{href:`#user-content-fn-1`,id:`user-content-fnref-1`,"data-footnote-ref":!0,"aria-describedby":`footnote-label`,children:`2`})}),`. We
can then write the Hamiltonian in its most general form as:`]}),`
`,(0,n.jsx)(s.pre,{children:(0,n.jsx)(s.code,{className:`language-math math-display`,children:`
\\hat{H} = \\frac{\\hbar}{2}\\left( \\begin{array}{cc} \\Delta  & \\Omega_x - i\\Omega_y\\\\ \\Omega_x +i\\Omega_y & -\\Delta \\end{array} \\right)`})}),`
`,(0,n.jsx)(s.p,{children:`Sometimes we will also chose the definition:`}),`
`,(0,n.jsx)(s.pre,{children:(0,n.jsx)(s.code,{className:`language-math math-display`,children:`\\Omega = |\\Omega| e^{i\\varphi}=\\Omega_x + i\\Omega_y`})}),`
`,(0,n.jsx)(s.p,{children:`It is particularly useful for the case in which the
coupling is created by a laser. Another useful way of thinking about the
two-level system is as a spin in a magnetic field. Let us remind us of
the definitions of the of the spin-1/2 matrices:`}),`
`,(0,n.jsx)(s.pre,{children:(0,n.jsx)(s.code,{className:`language-math math-display`,children:`s_x = \\frac{\\hbar}{2}\\left(\\begin{array}{cc}
0 & 1\\\\
1 &  0
\\end{array}
\\right)~
s_y = \\frac{\\hbar}{2}\\left(\\begin{array}{cc}
0 & -i\\\\
i &  0
\\end{array}
\\right)~s_z =\\frac{\\hbar}{2} \\left(\\begin{array}{cc}
1 & 0\\\\
0 &  -1
\\end{array}
\\right)`})}),`
`,(0,n.jsx)(s.p,{children:`We then obtain:`}),`
`,(0,n.jsx)(s.pre,{children:(0,n.jsx)(s.code,{className:`language-math math-display`,children:`
\\hat{H} = \\mathbf{B}\\cdot\\hat{\\mathbf{s}}\\text{ with }\\mathbf{B} = (\\Omega_x, \\Omega_y, \\Delta)`})}),`
`,(0,n.jsx)(s.p,{children:`You will go through this calculation in the excercise of
this week.`}),`
`,(0,n.jsxs)(s.h3,{children:[`Case of no perturbation `,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`\\Omega = 0`})]}),`
`,(0,n.jsxs)(s.p,{children:[`This is exactly the case of no applied laser fields that we discussed
previously. We simply removed the energy offset
`,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`E_m = \\frac{E_0+E_1}{2}`}),` and pulled out the factor `,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`\\hbar`}),`, such that
`,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`\\Delta`}),` measures a frequency. So we have:`]}),`
`,(0,n.jsx)(s.pre,{children:(0,n.jsx)(s.code,{className:`language-math math-display`,children:`E_0 = E_m+ \\frac{\\hbar}{2}\\Delta\\\\
E_1 = E_m- \\frac{\\hbar}{2}\\Delta`})}),`
`,(0,n.jsxs)(s.p,{children:[`We typically call `,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`\\Delta`}),` the energy difference between
the levels or the `,(0,n.jsx)(s.strong,{children:`detuning`}),`.`]}),`
`,(0,n.jsxs)(s.h3,{children:[`Case of no detuning `,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`\\Delta = 0`})]}),`
`,(0,n.jsxs)(s.p,{children:[`Let us suppose that the diagonal elements are exactly zero. And for
simplicity we will also keep `,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`\\Omega_y =0`}),` as it simply complicates the
calculations without adding much to the discussion at this stage. The
Hamiltonian reads then:`]}),`
`,(0,n.jsx)(s.pre,{children:(0,n.jsx)(s.code,{className:`language-math math-display`,children:`\\hat{H} = \\frac{\\hbar}{2}\\left( \\begin{array}{cc} 0  & \\Omega\\\\ \\Omega &0 \\end{array} \\right)`})}),`
`,(0,n.jsxs)(s.p,{children:[`Quite clearly the states `,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`\\varphi_{1,2}`}),` are not the eigenstates of the
system anymore. How should the system be described now ? We can once
again diagonalize the system and write`]}),`
`,(0,n.jsx)(s.pre,{children:(0,n.jsx)(s.code,{className:`language-math math-display`,children:`\\hat{H}\\left|\\varphi_{\\pm}\\right\\rangle = E_{\\pm}\\left|\\varphi_\\pm\\right\\rangle\\\\
E_{\\pm} = \\pm\\frac{\\hbar}{2}\\Omega\\\\
\\left|\\varphi_\\pm\\right\\rangle = \\frac{\\left|0\\right\\rangle\\pm\\left|1\\right\\rangle}{\\sqrt{2}}`})}),`
`,(0,n.jsx)(s.p,{children:`Two important consequences can be understood from this
result:`}),`
`,(0,n.jsxs)(s.ol,{children:[`
`,(0,n.jsxs)(s.li,{children:[`
`,(0,n.jsxs)(s.p,{children:[`The coupling of the two states shifts their energy by `,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`\\Omega`}),`. This
is the idea of level repulsion.`]}),`
`]}),`
`,(0,n.jsxs)(s.li,{children:[`
`,(0,n.jsx)(s.p,{children:`The coupled states are a superposition of the initial states.`}),`
`]}),`
`]}),`
`,(0,n.jsxs)(s.p,{children:[`This is also a motivation the formulation of the 'bare' system for
`,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`\\Omega = 0`}),` and the 'dressed' states for the coupled system.`]}),`
`,(0,n.jsx)(s.h3,{children:`General case`}),`
`,(0,n.jsx)(s.p,{children:`Quite importantly we can solve the system completely even in the general
case. By diagonalizing the Hamiltonian we obtain:`}),`
`,(0,n.jsx)(s.pre,{children:(0,n.jsx)(s.code,{className:`language-math math-display`,children:` E_\\pm = \\pm \\frac{\\hbar}{2} \\sqrt{\\Delta^2+|\\Omega|^2}`})}),`
`,(0,n.jsx)(s.p,{children:`The energies can be nicely summarized as in Fig.`}),`
`,(0,n.jsx)(t,{id:`fig-energy-levels`,href:i,width:`90%`,alt:`Energy levels and eigenstates diagram for the two-level system`,caption:`Energy levels and eigenstates of the two-level system showing the coupling Ω and detuning Δ.`}),`
`,(0,n.jsx)(s.p,{children:`The Eigenstates then read:`}),`
`,(0,n.jsx)(s.pre,{children:(0,n.jsx)(s.code,{className:`language-math math-display`,children:`\\left|\\psi_+\\right\\rangle=\\cos\\left(\\frac{\\theta}{2}\\right) \\mathrm{e}^{-i{\\varphi}/{2}}\\left|0\\right\\rangle+\\sin\\left(\\frac{\\theta}{2}\\right) \\mathrm{e}^{i{\\varphi}/{2}}\\left|1\\right\\rangle,`})}),`
`,(0,n.jsx)(s.pre,{children:(0,n.jsx)(s.code,{className:`language-math math-display`,children:`\\left|\\psi_-\\right\\rangle=-\\sin\\left(\\frac{\\theta}{2}\\right) \\mathrm{e}^{-i{\\varphi}/{2}}\\left|0\\right\\rangle+\\cos\\left(\\frac{\\theta}{2}\\right) \\mathrm{e}^{i{\\varphi}/{2}}\\left|1\\right\\rangle,`})}),`
`,(0,n.jsx)(s.p,{children:`where`}),`
`,(0,n.jsx)(s.pre,{children:(0,n.jsx)(s.code,{className:`language-math math-display`,children:`
\\tan(\\theta) = \\frac{|\\Omega|}{\\Delta}`})}),`
`,(0,n.jsx)(s.h2,{children:`The Bloch sphere`}),`
`,(0,n.jsx)(s.p,{children:`While we could just discuss the details of the above state in the
abstract, it is extremely helpful to visualize the problem on the Bloch
sphere. The idea of the Bloch sphere is that the we have a complex wave
function of well defined norm and two free parameters. So it seems quite
natural to look for a good representation of it. And this is the Bloch
sphere as drawn below`}),`
`,(0,n.jsx)(t,{id:`fig-bloch-sphere`,href:a,width:`90%`,alt:`The Bloch sphere representation of quantum states`,caption:`The Bloch sphere: A geometrical representation of quantum states in a two-level system, where any quantum state can be represented as a point on the unit sphere.`}),`
`,(0,n.jsx)(s.p,{children:`We will see especially its usefulness especially as we discuss the
dynamics of the two-state system.`}),`
`,(0,n.jsx)(s.h2,{children:`Dynamical Aspects`}),`
`,(0,n.jsxs)(s.h3,{children:[`Time Evolution of `,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`\\left|\\psi(t)\\right\\rangle`})]}),`
`,(0,n.jsxs)(s.p,{children:[`After the static case we now want to investigate the dynamical
properties of the two-state system. We calculate the time evolution of
`,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`\\left|\\psi(t)\\right\\rangle = c_0(t)\\left|0\\right\\rangle + c_1(t)\\left|1\\right\\rangle`}),`
with the Schrödinger equation and the perturbed Hamiltonian:`]}),`
`,(0,n.jsx)(s.pre,{children:(0,n.jsx)(s.code,{className:`language-math math-display`,children:`i\\hbar \\frac{d}{dt}\\left|\\psi(t)\\right\\rangle=\\hat{H}\\left|\\psi(t)\\right\\rangle,\\\\
i \\frac{d}{dt}\\left(\\begin{array}{c} c_0(t) \\\\ c_1(t) \\end{array}\\right) = \\frac{1}{2}\\left( \\begin{array}{cc} \\Delta & \\Omega \\\\ \\Omega^* & -\\Delta \\end{array} \\right) \\left(\\begin{array}{c} c_0(t) \\\\ c_1(t) \\end{array} \\right).`})}),`
`,(0,n.jsxs)(s.p,{children:[`We have two coupled differential equations and we luckily already know
how to solve them as we have calculated the two eigenenergies in the
previous section. For the state
`,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`\\left|\\psi(t)\\right\\rangle`}),` we get`]}),`
`,(0,n.jsx)(s.pre,{children:(0,n.jsx)(s.code,{className:`language-math math-display`,children:` \\left|\\psi(t)\\right\\rangle=\\lambda \\mathrm{e}^{-i{E_+}t/{\\hbar}} \\left|\\psi_+\\right\\rangle + \\mu \\mathrm{e}^{-i{E_-}t/{\\hbar}} \\left|\\psi_-\\right\\rangle`})}),`
`,(0,n.jsxs)(s.p,{children:[`with the factors `,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`\\lambda`}),` and `,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`\\mu`}),`, which are defined
by the initial state. The most common question is then what happens to
the system if we start out in the bare state
`,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`\\left|0\\right\\rangle`}),` and then let it evolve under
coupling with a laser ? So what is the probability to find it in the
other state `,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`\\left|1\\right\\rangle`}),`:`]}),`
`,(0,n.jsx)(s.pre,{children:(0,n.jsx)(s.code,{className:`language-math math-display`,children:`P_1(t)=\\left|\\left\\langle 1|\\psi(t)\\right\\rangle\\right|^2.`})}),`
`,(0,n.jsxs)(s.p,{children:[`As a first step, we have to apply the initial condition
to and express
`,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`\\left|\\varphi\\right\\rangle`}),` in terms of `,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`|\\psi_+`}),` and `,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`|\\psi_-`}),`:`]}),`
`,(0,n.jsx)(s.pre,{children:(0,n.jsx)(s.code,{className:`language-math math-display`,children:`\\left|\\psi(0)\\right\\rangle \\overset{!}{=} \\left|0\\right\\rangle\\\\
  = \\mathrm{e}^{i{\\varphi}/{2}} \\left[ \\cos\\left( \\frac{\\theta}{2}\\right) \\left|\\psi_+\\right\\rangle-\\sin\\left(\\frac{\\theta}{2}\\right)\\left|\\psi_-\\right\\rangle\\right]`})}),`
`,(0,n.jsxs)(s.p,{children:[`By equating the coefficients we get for `,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`\\lambda`}),` and
`,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`\\mu`}),`:`]}),`
`,(0,n.jsx)(s.pre,{children:(0,n.jsx)(s.code,{className:`language-math math-display`,children:`\\lambda = \\mathrm{e}^{i{\\varphi}/{2}}\\cos\\left(\\frac{\\theta}{2}\\right), \\qquad  \\mu = -\\mathrm{e}^{i{\\varphi}/{2}}\\sin\\left(\\frac{\\theta}{2}\\right).`})}),`
`,(0,n.jsx)(s.p,{children:`One thus gets:`}),`
`,(0,n.jsx)(s.pre,{children:(0,n.jsx)(s.code,{className:`language-math math-display`,children:`\\hspace{-2mm} P_1(t)=\\left|\\left\\langle 1|\\psi(t)\\right\\rangle\\right|^2 \\\\
= \\left|\\mathrm{e}^{i\\varphi} \\sin\\left(\\frac{\\theta}{2}\\right)\\cos\\left(\\frac{\\theta}{2}\\right)\\left[\\mathrm{e}^{-i{E_+}t/{\\hbar}} - \\mathrm{e}^{-i{E_-}t/{\\hbar}}\\right]\\right|^2\\\\
= \\sin^2(\\theta)\\sin^2\\left(\\frac{E_+-E_-}{2\\hbar}t\\right)`})}),`
`,(0,n.jsxs)(s.p,{children:[(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`P_1(t)`}),` can be expressed with `,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`\\Delta`}),` and `,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`\\Omega`}),`
alone. The obtained relation is called Rabi's formula:`]}),`
`,(0,n.jsx)(s.pre,{children:(0,n.jsx)(s.code,{className:`language-math math-display`,children:` P_1(t)=\\frac{1}{1+\\left(\\frac{\\Delta}{|\\Omega|}\\right)^2}\\sin^2\\left(\\sqrt{|\\Omega|^2+\\Delta^2}\\frac{t}{2}\\right)`})}),`
`,(0,n.jsx)(t,{id:`fig-rabi-oscillations`,href:o,width:`90%`,alt:`Rabi oscillations and population dynamics`,caption:`Rabi oscillations: The time evolution of the population in state 1 according to Rabi's formula, showing oscillatory behavior at the Rabi frequency √(|Ω|² + Δ²).`}),`
`,(0,n.jsx)(s.h3,{children:`Visualization of the dynamics in the spin picture`}),`
`,(0,n.jsx)(s.p,{children:`While the previous derivation might be the standard one, which certainly
leads to the right results it might not be the most intuitive way of
thinking about the dynamics. They become actually quite transparent in
the spin language and on the Bloch sphere. So let us go back to the
formulation of the Hamiltonian in terms of spins as at the beginning of the lecture.`}),`
`,(0,n.jsxs)(s.p,{children:[`How would the question of the time evolution from `,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`0`}),` to `,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`1`}),` and back go
now ? Basically, we would assume that the spin has been initialize into
one of the eigenstates of the `,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`z`}),`-basis and now starts to rotate in some
magnetic field. How ? This can be nicely studied in the Heisenberg
picture, where operators have a time evolution. In the Heisenberg
picture we have:`]}),`
`,(0,n.jsx)(s.pre,{children:(0,n.jsx)(s.code,{className:`language-math math-display`,children:`\\frac{d}{dt} \\hat{s}_i = \\frac{i}{\\hbar}\\left[\\hat{H},\\hat{s}_i\\right]\\\\
\\frac{d}{dt} \\hat{s}_i = \\frac{i}{\\hbar}\\sum_j B_j \\left[\\hat{s}_j,\\hat{s}_i\\right]\\\\

`})}),`
`,(0,n.jsx)(s.p,{children:`So to understand we time evolution, we only need to
employ the commutator relationships between the spins:`}),`
`,(0,n.jsx)(s.pre,{children:(0,n.jsx)(s.code,{className:`language-math math-display`,children:`= \\hbar is_z~~[ s_y, s_z] = \\hbar is_x~~[ s_z, s_x] = \\hbar is_y`})}),`
`,(0,n.jsxs)(s.p,{children:[`For the specific case of `,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`B_x=\\Omega`}),`, `,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`B_y = B_z = 0`}),`,
we have then:`]}),`
`,(0,n.jsx)(s.pre,{children:(0,n.jsx)(s.code,{className:`language-math math-display`,children:`\\frac{d}{dt} \\hat{s}_x = 0\\\\
\\frac{d}{dt} \\hat{s}_y = -\\Omega \\hat{s}_z\\\\
\\frac{d}{dt} \\hat{s}_z = \\Omega \\hat{s}_y

`})}),`
`,(0,n.jsxs)(s.p,{children:[`So applying a field in x-direction leads to a rotation of the spin
around the `,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`x`}),` axis with velocity `,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`\\Omega`}),`. We can now use this general
picture to understand the dynamics as rotations around an axis, which is
defined by the different components of the magnetic field.`]}),`
`,(0,n.jsx)(s.h2,{children:`A few words on the quantum information notation`}),`
`,(0,n.jsxs)(s.p,{children:[`The qubit is THE basic ingredient of quantum computers. A nice way to
play around with them is actually the `,(0,n.jsx)(s.a,{href:`https://quantum-computing.ibm.com/`,children:`IBM Quantum
experience`}),`. However, you will
typically not find Pauli matrices etc within these systems. The typical
notation there is:`]}),`
`,(0,n.jsxs)(s.ul,{children:[`
`,(0,n.jsxs)(s.li,{children:[`
`,(0,n.jsxs)(s.p,{children:[(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`R_x(\\phi)`}),` is a rotation around the x-axis for an angle `,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`\\phi`}),`.`]}),`
`]}),`
`,(0,n.jsxs)(s.li,{children:[`
`,(0,n.jsxs)(s.p,{children:[`Same holds for `,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`R_y`}),` and `,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`R_z`}),`.`]}),`
`]}),`
`,(0,n.jsxs)(s.li,{children:[`
`,(0,n.jsxs)(s.p,{children:[(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`X`}),` denotes the rotation around the x axis for an angle `,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`\\pi`}),`. So it
transforms `,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`\\left|1\\right\\rangle`}),` into
`,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`\\left|0\\right\\rangle`}),` and vise versa.`]}),`
`]}),`
`,(0,n.jsxs)(s.li,{children:[`
`,(0,n.jsxs)(s.p,{children:[(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`Z`}),` denotes the rotation around the x axis for an angle `,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`\\pi`}),`. So it
transforms `,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`\\left|+\\right\\rangle`}),` into
`,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`\\left|-\\right\\rangle`}),` and vise versa.`]}),`
`]}),`
`]}),`
`,(0,n.jsxs)(s.p,{children:[`The most commonly used gate is actually one that we did not talk about
at all, it is the `,(0,n.jsx)(s.em,{children:`Hadamard`}),` gate, which transforms
`,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`\\left|1\\right\\rangle`}),` into
`,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`\\left|-\\right\\rangle`}),` and
`,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`\\left|0\\right\\rangle`}),` into
`,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`\\left|+\\right\\rangle`}),`:`]}),`
`,(0,n.jsx)(s.pre,{children:(0,n.jsx)(s.code,{className:`language-math math-display`,children:`\\hat{H}\\left|1\\right\\rangle = \\left|-\\right\\rangle  ~   \\hat{H}\\left|0\\right\\rangle = \\left|+\\right\\rangle\\\\
\\hat{H}\\left|-\\right\\rangle = \\left|1\\right\\rangle  ~   \\hat{H}\\left|+\\right\\rangle = \\left|0\\right\\rangle`})}),`
`,(0,n.jsx)(s.p,{children:`In the forth lecture we will see how it is that a time-dependent field can actually couple two atomic states, which are normally of very different energies.`}),`
`,(0,n.jsxs)(s.section,{"data-footnotes":!0,className:`footnotes`,children:[(0,n.jsx)(s.h2,{className:`sr-only`,id:`footnote-label`,children:`Footnotes`}),`
`,(0,n.jsxs)(s.ol,{children:[`
`,(0,n.jsxs)(s.li,{id:`user-content-fn-ct1`,children:[`
`,(0,n.jsxs)(s.p,{children:[`Quantum Mechanics, Volume 1. Cohen-Tannoudji, Diu, Laloe. Wiley-VCH, 2006. `,(0,n.jsx)(s.a,{href:`#user-content-fnref-ct1`,"data-footnote-backref":``,"aria-label":`Back to reference 1`,className:`data-footnote-backref`,children:`↩`})]}),`
`]}),`
`,(0,n.jsxs)(s.li,{id:`user-content-fn-1`,children:[`
`,(0,n.jsxs)(s.p,{children:[`See the discussions of the next lecture `,(0,n.jsx)(s.a,{href:`#user-content-fnref-1`,"data-footnote-backref":``,"aria-label":`Back to reference 2`,className:`data-footnote-backref`,children:`↩`})]}),`
`]}),`
`]}),`
`]})]})}function l(e={}){let{wrapper:t}=e.components||{};return t?(0,n.jsx)(t,{...e,children:(0,n.jsx)(c,{...e})}):c(e)}export{l as default,s as frontmatter};