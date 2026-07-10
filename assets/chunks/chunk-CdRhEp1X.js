import{Cn as e}from"./chunk-YPwviyFJ.js";import{t}from"./chunk-BNReSP_g2.js";var n=e(),r=`/assets/static/lecture20_pic1.1L5yMPFo.png`,i=`/assets/static/lecture20_pic2.DPZgBcDl.png`,a=`/assets/static/lecture20_pic3.BrFT3ZTD.png`,o=`/assets/static/lecture20_pic5.ASl11oCu.png`,s=`/assets/static/lecture20_pic6.t2T9-tRI.png`,c=`/assets/static/lecture20_pic7.npQ11Wnw.png`,l=`/assets/static/lecture20_pic8.Dy77nzOB.png`,u={author:[`fretchen`],order:20,title:`Lecture 20 - A few words on quantum computing with trapped ions`};function d(e){let u={a:`a`,code:`code`,em:`em`,h1:`h1`,h2:`h2`,li:`li`,ol:`ol`,p:`p`,pre:`pre`,section:`section`,strong:`strong`,sup:`sup`,ul:`ul`,...e.components};return(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)(u.p,{children:`In this lecture we are going to discuss the fundamental ingredients for
quantum computing with trapped ions. In a first step, we discuss
trapping and cooling, then single qubit operations and finally two-qubit
operations.`}),`
`,(0,n.jsxs)(u.p,{children:[`Quantum computation has become a branch of research at the interaction
of physics, engineering, mathematices and computer science by now. The
standard book on the topic is most likely the book by Nielsen and Chang
`,(0,n.jsx)(u.a,{href:`http://dx.doi.org/10.1017/cbo9780511976667`,children:`Nielsen 2009`}),`. However, an enormous amount of additional literature
exists, I will only reference here to `,(0,n.jsx)(u.a,{href:`https://arxiv.org/abs/1804.03719v1`,children:`a nice introduction`}),` a
more complete list is left for future discussions.`]}),`
`,(0,n.jsxs)(u.p,{children:[`In this lecture we will discuss shortly the idea behind quantum
computing and the discuss its implementation on trapped ions. While a
large number of them exist, we decided to start with trapped ions for
several very subjective reasons `,(0,n.jsx)(u.sup,{children:(0,n.jsx)(u.a,{href:`#user-content-fn-1`,id:`user-content-fnref-1`,"data-footnote-ref":!0,"aria-describedby":`footnote-label`,children:`1`})}),`.`]}),`
`,(0,n.jsxs)(u.p,{children:[`And before we can start the discussion we would highly recommend the
readers to take some time to go through the Nobel prize lecture of Dave
Wineland as it gives a detailled discussion of the field from his point
of view `,(0,n.jsx)(u.a,{href:`http://dx.doi.org/10.1103/revmodphys.85.1103`,children:`Wineland 2013`}),`.`]}),`
`,(0,n.jsx)(u.h1,{children:`What do we want from a QC ?`}),`
`,(0,n.jsx)(u.p,{children:`In a QC we would like to implement algorithms, which are based on well
defined operations. Influential examples of such algorithms are the
quantum Fourier transform and the Grover algorithm.`}),`
`,(0,n.jsxs)(u.p,{children:[`Given that computations are typically implemented through logical truth
tables, we typically base a quantum computer on qubits. We then call one
state `,(0,n.jsx)(u.code,{className:`language-math math-inline`,children:`\\left|0\\right\\rangle`}),` and on
`,(0,n.jsx)(u.code,{className:`language-math math-inline`,children:`\\left|1\\right\\rangle`}),`. Given that we would like to have
reproducable computations, we always assume that we start them out with
all qubits in the `,(0,n.jsx)(u.code,{className:`language-math math-inline`,children:`\\left|0\\right\\rangle`}),` state.`]}),`
`,(0,n.jsx)(u.p,{children:`A computation consists then in applying a number of gates. The key is
here that any algorithm might be built up from an extremely limited
number of gates. Typically four are sufficient:`}),`
`,(0,n.jsxs)(u.ul,{children:[`
`,(0,n.jsxs)(u.li,{children:[`
`,(0,n.jsx)(u.p,{children:`The three gates that rotate each individual qubit on the Bloch
sphere.`}),`
`]}),`
`,(0,n.jsxs)(u.li,{children:[`
`,(0,n.jsx)(u.p,{children:`A gate that entangles them properly. The standard example is here
the CNOT gate, which we will come back too.`}),`
`]}),`
`]}),`
`,(0,n.jsx)(u.p,{children:`Such computations are then typically nicely visualized through circuit
diagrams as used them already for the study of Bell inequalities and
visualized below.`}),`
`,(0,n.jsx)(t,{id:`fig-circuit`,href:r,caption:`A simple circuit diagram. It show the initial state, an entanglement gate, a number of single qubit gates and the final readout.`}),`
`,(0,n.jsxs)(u.p,{children:[`As atomic physics is only a minor part of the QC field, we typically
have to learn the new notations of the field again. As such single qubit
gates are typically not explained through the Pauli matrices but by
different symbols like `,(0,n.jsx)(u.code,{className:`language-math math-inline`,children:`H`}),` or `,(0,n.jsx)(u.code,{className:`language-math math-inline`,children:`Z`}),`. We come back to this later.`]}),`
`,(0,n.jsx)(u.h2,{children:`Some of the hopes for QCs`}),`
`,(0,n.jsxs)(u.p,{children:[`The major point to about a properly chosen set of gates is that it
allows us to implement ANY algorithm. So they allow us to implement a
`,(0,n.jsx)(u.em,{children:`universal`}),` quantum computer. The main question is then how powerful
such a QC would be. Could it solve problems as fast a a classical
computer or maybe even faster ? This question is at the hard of the
field of complexity classes, which studies which kind of problem can be
solved `,(0,n.jsx)(u.a,{href:`https://complexityzoo.uwaterloo.ca/Petting_Zoo`,children:`how efficiently`}),`.`]}),`
`,(0,n.jsx)(u.p,{children:`The most fundamental question is then if a problem can be solved in a
polynomial time (P hard) or not (NP-hard). Linear problems are P-hard
and the travelling salesman problem is NP-hard. For some problems a
quantum computer might then provide an answer in polynomial time, where
a classical computer would not... The factorization of prime numbers is
one of these problems as discussed in Shor algorithm.`}),`
`,(0,n.jsxs)(u.p,{children:[`And the google paper that was published in 2019 actually indicated for
the first time that a quantum computer achieved such a task
`,(0,n.jsx)(u.a,{href:`http://dx.doi.org/10.1038/s41586-019-1666-5`,children:`Arute 2019`}),`.`]}),`
`,(0,n.jsx)(u.h2,{children:`Requirements for a QC`}),`
`,(0,n.jsxs)(u.p,{children:[`Given our excitement for a quantum computer, we might want a checklist
of what we want from a quantum computer hardware. DiVincenzo proposed
`,(0,n.jsx)(u.a,{href:`http://dx.doi.org/10.1016/j.physrep.2008.09.003`,children:`the following ingredients`}),`:`]}),`
`,(0,n.jsxs)(u.ol,{children:[`
`,(0,n.jsxs)(u.li,{children:[`
`,(0,n.jsx)(u.p,{children:`Qubits that can store information in a scalable system.`}),`
`]}),`
`,(0,n.jsxs)(u.li,{children:[`
`,(0,n.jsx)(u.p,{children:`The ability to initialize the system in the right state.`}),`
`]}),`
`,(0,n.jsxs)(u.li,{children:[`
`,(0,n.jsx)(u.p,{children:`A universal set of gates.`}),`
`]}),`
`,(0,n.jsxs)(u.li,{children:[`
`,(0,n.jsx)(u.p,{children:`Long coherence times, which are much longer than gate operation
times.`}),`
`]}),`
`,(0,n.jsxs)(u.li,{children:[`
`,(0,n.jsx)(u.p,{children:`Good measurement capabilities`}),`
`]}),`
`]}),`
`,(0,n.jsx)(u.p,{children:`Trapped ions allow us to fulfill all these requirements as we will see
in this lecture and we will go through them step-by-step.`}),`
`,(0,n.jsx)(u.h1,{children:`Trapping and cooling`}),`
`,(0,n.jsxs)(u.p,{children:[`For computing experiments one typically works with singe-charged ions
like `,(0,n.jsx)(u.code,{className:`language-math math-inline`,children:`^{40}Ca^+`}),`. Given their charge, they can be trapped in very clean
traps under vacuum. As such they are extremely well isolated from the
environment and high precision experiments can be performed. Finally,
they have only one remain electron in the outer shell. Therefore they
have a hydrogenlike atomic structure.`]}),`
`,(0,n.jsxs)(u.p,{children:[`However, the trap construction is not trivial given Maxwells equation
`,(0,n.jsx)(u.code,{className:`language-math math-inline`,children:`\\text{div} \\vec{E} = 0`}),`. So, the experimentalists have to play some
tricks with oscillating fields. We will not derive in detail how a
resulting `,(0,n.jsx)(u.strong,{children:`Paul trap`}),` works, but the `,(0,n.jsx)(u.a,{href:`https://youtu.be/Xb-zpM0UOzk`,children:`linked
video`}),` gives a very nice impression of the
idea behind it.`]}),`
`,(0,n.jsxs)(u.p,{children:[`This work on trapping ions dates back to the middle of the last century
(!!!) and was recognized by the`,(0,n.jsx)(u.a,{href:`https://www.nobelprize.org/prizes/physics/1989/summary/`,children:` Nobel prize in
1989`}),` for
`,(0,n.jsx)(u.a,{href:`http://dx.doi.org/10.1103/revmodphys.62.531`,children:`Wolfgang Paul`}),` and `,(0,n.jsx)(u.a,{href:`http://dx.doi.org/10.1103/revmodphys.62.525`,children:`Hans Dehmelt`}),`. They shared
the prize with Norman Ramsey, who developped extremely precise
spectroscopic methods, now known as `,(0,n.jsx)(u.a,{href:`http://dx.doi.org/10.1103/revmodphys.62.541`,children:`Ramsey spectroscopy`}),`.`]}),`
`,(0,n.jsx)(t,{id:`fig-paul`,href:i,caption:`The two phases of the oscillating electric field of a Paul trap. Taken from [wikipedia](https://en.wikipedia.org/wiki/Quadrupole_ion_trap).`}),`
`,(0,n.jsx)(t,{id:`fig-paul-exp`,href:a,caption:`A linear ion (Paul) trap containing six calcium 40 ions. Taken from [here](https://quantumoptics.at/en/research/lintrap.html).`}),`
`,(0,n.jsx)(u.p,{children:`A Paul trap provides a harmonic oscillator confinement with trapping
frequencies in the order of hundreds of kHz. An ion trapped in such a
trap can the be described by the Hamiltonian:`}),`
`,(0,n.jsx)(u.pre,{children:(0,n.jsx)(u.code,{className:`language-math math-display`,children:`
\\hat{H}_{t} = \\frac{\\hat{p}^2}{2m}+ \\frac{m\\omega_t^2}{2}\\hat{x}^2`})}),`
`,(0,n.jsxs)(u.p,{children:[`The two variables `,(0,n.jsx)(u.code,{className:`language-math math-inline`,children:`p`}),` and `,(0,n.jsx)(u.code,{className:`language-math math-inline`,children:`x`}),` are non-commuting `,(0,n.jsx)(u.code,{className:`language-math math-inline`,children:`[x, p] = i\\hbar`}),`, so
they cannot be measured at the same time. It can be nicely diagonalized
in terms of the ladder operators:`]}),`
`,(0,n.jsx)(u.pre,{children:(0,n.jsx)(u.code,{className:`language-math math-display`,children:`\\hat{x} = \\sqrt{\\frac{\\hbar}{2m\\omega_t}}\\left(\\hat{a}+\\hat{a}^\\dag\\right)\\\\
\\hat{p} = i\\sqrt{\\frac{\\hbar}{2m\\omega_t}}\\left(\\hat{a}^\\dag-\\hat{a}\\right)\\\\`})}),`
`,(0,n.jsx)(u.p,{children:`So the Hamiltonian can now be written as:`}),`
`,(0,n.jsx)(u.pre,{children:(0,n.jsx)(u.code,{className:`language-math math-display`,children:`\\hat{H} = \\hbar \\omega_t \\left(\\hat{N} + \\frac{1}{2}\\right)\\text{ with } \\hat{N} = a^\\dag a`})}),`
`,(0,n.jsx)(u.p,{children:`Having loaded the ions into the Paul trap we also need
to cool them down.`}),`
`,(0,n.jsx)(u.h1,{children:`Atom-light interaction`}),`
`,(0,n.jsxs)(u.p,{children:[`Given that the ions keep only on atom on the outer shell, they have a
hydrogenlike structure, which makes
them optically well controllable. To control the ions further we use
light of amplitude `,(0,n.jsx)(u.code,{className:`language-math math-inline`,children:`E_0`}),` and frequency `,(0,n.jsx)(u.code,{className:`language-math math-inline`,children:`\\omega_L`}),`:`]}),`
`,(0,n.jsx)(u.pre,{children:(0,n.jsx)(u.code,{className:`language-math math-display`,children:`\\vec{E}(t) = \\vec{E}_0 \\cos(kx - \\omega_L t+\\varphi)\\\\
= \\frac{\\vec{E}_0}{2} \\left(e^{i[kx - \\omega_lt+\\varphi]}+e^{-i[kx-\\omega_lt+\\varphi]}\\right)`})}),`
`,(0,n.jsxs)(u.p,{children:[`We will describe the interal states of the ion for the
moment with the simple two state system of ground state
`,(0,n.jsx)(u.code,{className:`language-math math-inline`,children:`\\left|g\\right\\rangle`}),` and excited state
`,(0,n.jsx)(u.code,{className:`language-math math-inline`,children:`\\left|e\\right\\rangle`}),` at an energy `,(0,n.jsx)(u.code,{className:`language-math math-inline`,children:`\\hbar \\omega_0`}),`, which
is typically in the order of thousands of THz. It has the Hamiltonian:`]}),`
`,(0,n.jsx)(u.pre,{children:(0,n.jsx)(u.code,{className:`language-math math-display`,children:`H_{ion} = \\hbar \\omega_0 \\left|e\\right\\rangle\\left\\langle e\\right|`})}),`
`,(0,n.jsxs)(u.p,{children:[`Putting this ion into propagating light will induce a
coupling between these two internal states. As previously , we will
describe the coupling in the semi-classical approximation through
`,(0,n.jsx)(u.code,{className:`language-math math-inline`,children:`H_\\textrm{int} = -\\hat{\\vec{D}} \\cdot \\vec{E}`}),`. However, in this
context we will not ignore the propagating nature of the light field and
keep its position dependence. This is necessary as we would like to
understand how the light influences the movement of the atoms and not
only the internal states. Putting them together we obtain:`]}),`
`,(0,n.jsx)(u.pre,{children:(0,n.jsx)(u.code,{className:`language-math math-display`,children:`H_\\textrm{int} = \\frac{\\Omega}{2}\\left([\\left|g\\right\\rangle\\left\\langle e\\right|+\\left|e\\right\\rangle\\left\\langle g\\right|]e^{i(k \\hat{x} - \\omega_L t+\\varphi)} + h.c.\\right)`})}),`
`,(0,n.jsxs)(u.p,{children:[`The laser frequency is tuned closely to the frequency of
the internal state transition and we will be only interested in the
detuning `,(0,n.jsx)(u.code,{className:`language-math math-inline`,children:`\\Delta = \\omega_0 - \\omega_L`}),`. Importantly, it couples the
position of the atom and the internal states.`]}),`
`,(0,n.jsx)(u.p,{children:`To simplify the problem, we can work in the rotating frame to describe
the external and internal degrees of freedom for the ion:`}),`
`,(0,n.jsx)(u.pre,{children:(0,n.jsx)(u.code,{className:`language-math math-display`,children:`
\\hat{H}= \\hbar \\omega_t \\hat{a}^\\dag \\hat{a} + \\hbar\\Delta \\left|e\\right\\rangle\\left\\langle e\\right| + \\frac{\\Omega}{2}\\left(\\left|e\\right\\rangle\\left\\langle g\\right|e^{i\\left(k \\hat{x}+\\varphi\\right)} + h.c.\\right)`})}),`
`,(0,n.jsx)(u.p,{children:`We will now see how this system is used to cool the ions to the motional
groundstate, perform single qubit operations and then two-qubit
operations.`}),`
`,(0,n.jsx)(u.h1,{children:`Doppler cooling`}),`
`,(0,n.jsxs)(u.p,{children:[`This interaction of the atom with a photon is at the origin of the
all-important Laser cooling, which was pioneered for ions in the 1970s
(!!) by the Wineland group. For cooling transition we couple the ground
state to an excited state of finitie lifetime `,(0,n.jsx)(u.code,{className:`language-math math-inline`,children:`\\tau= \\frac{1}{\\Gamma}`}),`.`]}),`
`,(0,n.jsx)(t,{id:`fig-laser-cooling`,href:i,caption:`The basic idea of laser cooling. The incoming light gives the ion a momentum kick $\\vec{k}_{in}$. The photon is reemitted in a random direction such that $<\\vec{k}_{out}>=0$.`}),`
`,(0,n.jsxs)(u.p,{children:[`This laser cooling had a tremendous impact on the field of atomic
physics in general. Notably it gave rise to the field of cold atoms to
which we will get back in the next lecture. This importance was
recognized in the Nobel prizes of 1997 for `,(0,n.jsx)(u.a,{href:`http://dx.doi.org/10.1103/revmodphys.70.685`,children:`Steve Chu`}),`, `,(0,n.jsx)(u.a,{href:`http://dx.doi.org/10.1103/revmodphys.70.707`,children:`Claude
Cohen-Tannoudji`}),` and `,(0,n.jsx)(u.a,{href:`http://dx.doi.org/10.1103/revmodphys.70.721`,children:`Bill Phillips`}),`.`]}),`
`,(0,n.jsx)(u.h2,{children:`Working in the Lamb-Dicke regime`}),`
`,(0,n.jsx)(u.p,{children:`After this initial cooling stage the atoms have to be cooled to the
ground state in the trap. To treat the trapped particles we will express
the position operator in terms of the ladder operator, such that:`}),`
`,(0,n.jsx)(u.pre,{children:(0,n.jsx)(u.code,{className:`language-math math-display`,children:`k\\hat{x} = \\eta (\\hat{a}^\\dag+ \\hat{a})\\\\
\\eta = \\sqrt{\\frac{\\hbar^2 k^2/2m}{\\hbar \\omega_t}} =\\sqrt{\\frac{E_R}{\\hbar \\omega_t}}`})}),`
`,(0,n.jsxs)(u.p,{children:[(0,n.jsx)(u.code,{className:`language-math math-inline`,children:`\\eta`}),` is called the `,(0,n.jsx)(u.em,{children:`Lamb-Dicke`}),` parameter. It compares
the change in motional energy due to the absorption of the photon
`,(0,n.jsx)(u.code,{className:`language-math math-inline`,children:`E_r = \\frac{(\\hbar k)^2}{2m}`}),` compared to the energy spacing
`,(0,n.jsx)(u.code,{className:`language-math math-inline`,children:`\\hbar \\omega_t`}),` in the trap. When it is small it suppresses the change
of the motional state of the atom due to the absorption of a photon.`]}),`
`,(0,n.jsxs)(u.p,{children:[`For simplicity we will set in this section `,(0,n.jsx)(u.code,{className:`language-math math-inline`,children:`\\varphi=0`}),` and develop the
exponent to obtain:`]}),`
`,(0,n.jsx)(u.pre,{children:(0,n.jsx)(u.code,{className:`language-math math-display`,children:`H_\\textrm{int} = \\frac{\\Omega}{2}\\left(\\left|e\\right\\rangle\\left\\langle g\\right|\\left(1 + i\\eta[\\hat{a}^\\dag+ \\hat{a}]\\right) + h.c.\\right)`})}),`
`,(0,n.jsx)(u.p,{children:`So it contains three couplings for different trap levels
and internal states:`}),`
`,(0,n.jsxs)(u.ul,{children:[`
`,(0,n.jsxs)(u.li,{children:[`
`,(0,n.jsxs)(u.p,{children:[`The `,(0,n.jsx)(u.em,{children:`carrier`}),` transition
`,(0,n.jsx)(u.code,{className:`language-math math-inline`,children:`\\left|g,n\\right\\rangle\\rightarrow \\left|e,n\\right\\rangle`}),`
with strength `,(0,n.jsx)(u.code,{className:`language-math math-inline`,children:`\\Omega`}),`.`]}),`
`]}),`
`,(0,n.jsxs)(u.li,{children:[`
`,(0,n.jsxs)(u.p,{children:[`The `,(0,n.jsx)(u.em,{children:`red`}),` sideband
`,(0,n.jsx)(u.code,{className:`language-math math-inline`,children:`\\left|g,n\\right\\rangle\\rightarrow \\left|e,n-1\\right\\rangle`}),`
with strength `,(0,n.jsx)(u.code,{className:`language-math math-inline`,children:`\\eta \\Omega(n+1)`}),`. It leads to a reduction of the
trap level and it is resonant for `,(0,n.jsx)(u.code,{className:`language-math math-inline`,children:`\\Delta = -\\omega_t`}),`.`]}),`
`]}),`
`,(0,n.jsxs)(u.li,{children:[`
`,(0,n.jsxs)(u.p,{children:[`The `,(0,n.jsx)(u.em,{children:`blue`}),` sideband
`,(0,n.jsx)(u.code,{className:`language-math math-inline`,children:`\\left|g,n\\right\\rangle\\rightarrow \\left|e,n+1\\right\\rangle`}),`
with strength `,(0,n.jsx)(u.code,{className:`language-math math-inline`,children:`\\eta \\Omega n`}),`. It leads to an increase of the trap
level and it is resonant for `,(0,n.jsx)(u.code,{className:`language-math math-inline`,children:`\\Delta = \\omega_t`}),`.`]}),`
`]}),`
`]}),`
`,(0,n.jsx)(u.p,{children:`The full energy diagram is summarized in the figure below.`}),`
`,(0,n.jsx)(t,{id:`fig-paul-exp`,href:o,caption:`Level structure of an two-level system coupled to a laser field as discussed in the text.`}),`
`,(0,n.jsxs)(u.p,{children:[`This scheme is used to perform `,(0,n.jsx)(u.strong,{children:`Raman side-band cooling`}),`. The laser is
tuned on the transition
`,(0,n.jsx)(u.code,{className:`language-math math-inline`,children:`\\left|n,g\\right\\rangle\\rightarrow \\left|n-1,e\\right\\rangle`}),`
such that each absorption involves a reduction in the trap level. This
set-up for cooling was first demonstrated in `,(0,n.jsx)(u.a,{href:`http://dx.doi.org/10.1103/physrevlett.75.4011`,children:`1995 by the Wineland group`}),`.`]}),`
`,(0,n.jsx)(u.p,{children:`It is at this stage that the ions are in the motional ground state and
we can focus our attention to the high control of the internal qubit
states of the ion for quantum computing.`}),`
`,(0,n.jsx)(u.h1,{children:`Single-qubit operations`}),`
`,(0,n.jsxs)(u.p,{children:[`The single qubit operations can now be identified with the transition
`,(0,n.jsx)(u.code,{className:`language-math math-inline`,children:`\\left|e,n\\right\\rangle\\leftrightarrow \\left|g,n\\right\\rangle`}),`.
We can then simplify the atom-light interaction too:`]}),`
`,(0,n.jsx)(u.pre,{children:(0,n.jsx)(u.code,{className:`language-math math-display`,children:`\\hat{H}= \\hbar\\Delta \\left|e\\right\\rangle\\left\\langle e\\right| + \\frac{\\hbar\\Omega}{2}\\left(\\left|e\\right\\rangle\\left\\langle g\\right|e^{i\\varphi} +\\left|g\\right\\rangle\\left\\langle e\\right|e^{-i\\varphi}\\right)`})}),`
`,(0,n.jsx)(u.p,{children:`We can translate this into the language of qubit
operations through the definitions:`}),`
`,(0,n.jsx)(u.pre,{children:(0,n.jsx)(u.code,{className:`language-math math-display`,children:`\\sigma_z = \\frac{\\left|e\\right\\rangle\\left\\langle e\\right|-\\left|g\\right\\rangle\\left\\langle g\\right|}{2}\\\\
\\sigma_x = \\frac{\\left|e\\right\\rangle\\left\\langle g\\right|+\\left|g\\right\\rangle\\left\\langle e\\right|}{2}\\\\
\\sigma_y = \\frac{i\\left|e\\right\\rangle\\left\\langle g\\right|-i\\left|g\\right\\rangle\\left\\langle e\\right|}{2}`})}),`
`,(0,n.jsx)(u.p,{children:`So we can now simply write the Hamiltonian as:`}),`
`,(0,n.jsx)(u.pre,{children:(0,n.jsx)(u.code,{className:`language-math math-display`,children:`\\hat{H}= \\hbar\\Delta \\sigma_z +\\Omega_x \\sigma_x +\\Omega_y \\sigma_y\\\\
\\Omega_x = \\Omega \\cos(\\varphi)\\\\
\\Omega_y = \\Omega \\sin(\\varphi)`})}),`
`,(0,n.jsxs)(u.p,{children:[`In the QC community people rarely talk about the Pauli matrices, but
much rather about a few specific gates. The most cited here is the
`,(0,n.jsx)(u.em,{children:`Hadamard`}),` gate, which transforms
`,(0,n.jsx)(u.code,{className:`language-math math-inline`,children:`\\left|0/1\\right\\rangle\\rightarrow \\frac{\\left|0\\right\\rangle\\pm\\left|1\\right\\rangle}{\\sqrt{2}}`}),`.
So it has no good classical analog. Further a double application brings
us back to the origin.`]}),`
`,(0,n.jsxs)(u.p,{children:[`The other gate we named about was a Z gate, which is simply a `,(0,n.jsx)(u.code,{className:`language-math math-inline`,children:`\\pi`}),`
rotation around the z axis.`]}),`
`,(0,n.jsx)(u.h1,{children:`Two-qubit operations`}),`
`,(0,n.jsxs)(u.p,{children:[`To implement a quantum computer the system has to be completed by a
two-qubit operation. For ions a number of two-qubit gates exist as
discussed nicely in `,(0,n.jsx)(u.a,{href:`http://dx.doi.org/10.1016/j.physrep.2008.09.003`,children:`Sec. 2.6 of Haffner 2008`}),`:`]}),`
`,(0,n.jsxs)(u.ul,{children:[`
`,(0,n.jsxs)(u.li,{children:[`
`,(0,n.jsxs)(u.p,{children:[`The `,(0,n.jsx)(u.strong,{children:`Cirac-Zoller`}),` gate was the `,(0,n.jsx)(u.a,{href:`http://dx.doi.org/10.1103/physrevlett.74.4091`,children:`first proposed two-qubit gate`}),`
[@Cirac_1995] and it was also the first one realized `,(0,n.jsx)(u.a,{href:`http://dx.doi.org/10.1103/physrevlett.75.4714`,children:`within the same
year`}),`.`]}),`
`]}),`
`,(0,n.jsxs)(u.li,{children:[`
`,(0,n.jsxs)(u.p,{children:[`The `,(0,n.jsx)(u.strong,{children:`Soerensen-Moelmer`}),` gate was `,(0,n.jsx)(u.a,{href:`http://dx.doi.org/10.1103/physrevlett.82.1971`,children:`proposed later`}),`,
but it is extremely important from a practical point of view as it
leads to very high entanglement fidelities.`]}),`
`]}),`
`,(0,n.jsxs)(u.li,{children:[`
`,(0,n.jsxs)(u.p,{children:[`Another realization, which we mention for completeness is the
geometric phase-gate, which is used `,(0,n.jsx)(u.a,{href:`http://dx.doi.org/10.1038/nature01492`,children:`in the NIST group`}),`.`]}),`
`]}),`
`]}),`
`,(0,n.jsxs)(u.p,{children:[`We will now discuss a bit the Soerensen-Moelmer gate, which is nicely
described `,(0,n.jsx)(u.a,{href:`http://dx.doi.org/10.1103/physreva.62.022311`,children:`here`}),`. In this set-up two ions sit in a
common trap. The cost of energy for exciting one of the ions will be
labelled `,(0,n.jsx)(u.code,{className:`language-math math-inline`,children:`\\omega_t`}),` as in the first section. So we assume that the
scheme starts in the state `,(0,n.jsx)(u.code,{className:`language-math math-inline`,children:`\\left|ggn\\right\\rangle`}),`, where
both atoms are in the internal ground-state `,(0,n.jsx)(u.code,{className:`language-math math-inline`,children:`g`}),` and in some excited trap
level `,(0,n.jsx)(u.code,{className:`language-math math-inline`,children:`n`}),`.`]}),`
`,(0,n.jsx)(u.p,{children:`In the next step, these two ions experience two lasers, which are
coupling excited and the ground state of the ions:`}),`
`,(0,n.jsxs)(u.ul,{children:[`
`,(0,n.jsxs)(u.li,{children:[`
`,(0,n.jsxs)(u.p,{children:[`One laser has frequency `,(0,n.jsx)(u.code,{className:`language-math math-inline`,children:`\\omega_1=\\omega_0-\\omega_t+\\delta`}),` and Rabi
coupling strength `,(0,n.jsx)(u.code,{className:`language-math math-inline`,children:`\\Omega`}),`. It is therefore only slightly detuned
from the transitions
`,(0,n.jsx)(u.code,{className:`language-math math-inline`,children:`|ggn\\rangle\\rightarrow|eg,n-1\\rangle |ge,n-1\\rangle`}),`.`]}),`
`]}),`
`,(0,n.jsxs)(u.li,{children:[`
`,(0,n.jsxs)(u.p,{children:[`The second laser has frequency `,(0,n.jsx)(u.code,{className:`language-math math-inline`,children:`\\omega_2=\\omega_0+\\omega_t-\\delta`}),`
and Rabi coupling strength `,(0,n.jsx)(u.code,{className:`language-math math-inline`,children:`\\Omega`}),`. It is therefore only slightly
detuned from the transitions
`,(0,n.jsx)(u.code,{className:`language-math math-inline`,children:`|ggn\\rangle\\rightarrow|eg,n+1\\rangle |ge,n+1\\rangle`}),`.`]}),`
`]}),`
`]}),`
`,(0,n.jsx)(u.p,{children:`The resulting level diagram is depicted below.`}),`
`,(0,n.jsx)(t,{href:s,caption:`Level scheme of the Sorensen Moelmer gate as described in the text.`}),`
`,(0,n.jsxs)(u.p,{children:[`The gate is then operated in the regime of small coupling strength
`,(0,n.jsx)(u.code,{className:`language-math math-inline`,children:`\\eta \\Omega n \\ll \\delta`}),`. In this case coupling to the excited
motional states `,(0,n.jsx)(u.code,{className:`language-math math-inline`,children:`n\\pm 1`}),` is suppressed by a factor of
`,(0,n.jsx)(u.code,{className:`language-math math-inline`,children:`\\frac{\\eta \\Omega n}{\\delta}`}),`. On the other hand we are exactly on
resonance for the two-photon transitions
`,(0,n.jsx)(u.code,{className:`language-math math-inline`,children:`|ggn\\rangle\\rightarrow|eg,n+1\\rangle\\rightarrow|ee,n\\rangle`}),` etc. So we
can do second-order pertubation theory to obtain the
effective Hamiltonian:`]}),`
`,(0,n.jsx)(u.pre,{children:(0,n.jsx)(u.code,{className:`language-math math-display`,children:`H_\\mathrm{SM} = \\frac{\\Omega_\\mathrm{SL}}{2}\\left(\\left|ggn\\right\\rangle\\left\\langle een\\right| + (\\left|een\\right\\rangle\\left\\langle ggn\\right|\\right)\\text{ with }\\Omega_{SL} = -\\frac{(\\Omega \\eta)^2}{2(\\eta - \\delta)}`})}),`
`,(0,n.jsxs)(u.p,{children:[`So starting out with the state
`,(0,n.jsx)(u.code,{className:`language-math math-inline`,children:`\\left|gg\\right\\rangle`}),` and applying the laser for
`,(0,n.jsx)(u.code,{className:`language-math math-inline`,children:`t\\Omega =\\frac{\\pi}{2}`}),`, we obtain the entangled state that we are
looking for.`]}),`
`,(0,n.jsxs)(u.p,{children:[`The operation of the gate was first demonstrated in 2000 by the Wineland
group and allowed at the time for generating a Bell state `,(0,n.jsx)(u.a,{href:`http://dx.doi.org/10.1038/35005011`,children:`with a
fidelity of 83%`}),`. This limit has been increasingly pushed
of the years and now `,(0,n.jsx)(u.a,{href:`http://dx.doi.org/10.1103/physrevlett.117.060504`,children:`reaches the 99.9% region`}),`.`]}),`
`,(0,n.jsx)(u.p,{children:`Such a fidelity sounds very impressive on first sight and it is by now
the result of several decades of work. However, in a quantum computer we
would like to chain a large number of these gates behind each other.`}),`
`,(0,n.jsxs)(u.ul,{children:[`
`,(0,n.jsxs)(u.li,{children:[`
`,(0,n.jsx)(u.p,{children:`After 10 iterations the fidelity dropped to 99%.`}),`
`]}),`
`,(0,n.jsxs)(u.li,{children:[`
`,(0,n.jsx)(u.p,{children:`After 100 iterations the fidelity dropped to 90%.`}),`
`]}),`
`,(0,n.jsxs)(u.li,{children:[`
`,(0,n.jsx)(u.p,{children:`After 1000 iterations the fidelity dropped to 30%.`}),`
`]}),`
`]}),`
`,(0,n.jsx)(u.p,{children:`So even with such an excellent fidelity it will barely be possible to
chain much more than 100 gates before the some extremely iffy things
start to happen.`}),`
`,(0,n.jsx)(t,{href:c,caption:`From the iSWAP to the CNOT gate.`}),`
`,(0,n.jsx)(u.p,{children:`So we have experimentally the choice of entanglement tool in the way
that is most adapted to our work.`}),`
`,(0,n.jsx)(u.h1,{children:`Practical considerations`}),`
`,(0,n.jsxs)(u.p,{children:[`A commonly used ion is `,(0,n.jsx)(u.code,{className:`language-math math-inline`,children:`\\mathrm{Ca+} \\, (Z=20)`}),`. The level scheme of the calcium atom is shown below. The different
transitions are used for different purposes:`]}),`
`,(0,n.jsxs)(u.ul,{children:[`
`,(0,n.jsxs)(u.li,{children:[`
`,(0,n.jsx)(u.p,{children:`The broad transition at 397nm is used for cooling.`}),`
`]}),`
`,(0,n.jsxs)(u.li,{children:[`
`,(0,n.jsx)(u.p,{children:`Coupling between the qubit states is performed through the 729nm
transition.`}),`
`]}),`
`,(0,n.jsxs)(u.li,{children:[`
`,(0,n.jsx)(u.p,{children:`The 866nm and the 854nm are used for pumping the atoms into
appropiate substates.`}),`
`]}),`
`]}),`
`,(0,n.jsx)(t,{href:l,caption:`The level scheme of the calcium atom. The arrows indicate transitions by absorption and emission of photons. A qubit can be realized by choosing the ground state and an excited state. Taken from [here](http://dx.doi.org/10.1088/1367-2630/15/12/123012).`}),`
`,(0,n.jsxs)(u.p,{children:[`Several solutions for scaling up the quantum computing architecture are
under way .\xA0`,(0,n.jsx)(u.em,{children:`Long ion chains`}),` in linear Paul traps with up to 40
ions are the current 'work-horse'. This is the 'simplest' existing
architecture. In such a geometry Shors algorithm was `,(0,n.jsx)(u.a,{href:`http://dx.doi.org/10.1126/science.aad9480`,children:`shown for the
number 15`}),` with five qubits and entanglement between up to
`,(0,n.jsx)(u.a,{href:`http://dx.doi.org/10.1103/physrevlett.106.130506`,children:`14 qubits was studied`}),`. However, it reaches its natural
limits for entangling distant ions due to cross-talk with other ions
during the operation. Therefore, different approaches are currently
tested to scale the architecture to larger `,(0,n.jsx)(u.a,{href:`http://dx.doi.org/10.1103/physrevx.7.041061`,children:`fault-tolerant geometries`}),`.`]}),`
`,(0,n.jsx)(u.p,{children:`By no means we will be able to give a full picture of the booming field.
However, a few main players are:`}),`
`,(0,n.jsxs)(u.ul,{children:[`
`,(0,n.jsxs)(u.li,{children:[`
`,(0,n.jsx)(u.p,{children:`NIST, JQI and IonQ, which are all strongly connected through their
shared past with Dave Wineland.`}),`
`]}),`
`,(0,n.jsxs)(u.li,{children:[`
`,(0,n.jsx)(u.p,{children:`Innsbruck,\xA0 Mainz and AQT which are connected through their shared
past and present with Rainer Blatt.`}),`
`]}),`
`,(0,n.jsxs)(u.li,{children:[`
`,(0,n.jsx)(u.p,{children:`ETH, Oxford, ...`}),`
`]}),`
`,(0,n.jsxs)(u.li,{children:[`
`,(0,n.jsx)(u.p,{children:`The AQTION and the MicroQC network, which are part of the European
flagship initiative.`}),`
`]}),`
`]}),`
`,(0,n.jsxs)(u.section,{"data-footnotes":!0,className:`footnotes`,children:[(0,n.jsx)(u.h2,{className:`sr-only`,id:`footnote-label`,children:`Footnotes`}),`
`,(0,n.jsxs)(u.ol,{children:[`
`,(0,n.jsxs)(u.li,{id:`user-content-fn-1`,children:[`
`,(0,n.jsxs)(u.p,{children:[`Philipp Hauke worked a lot with them. Fred is an AMO person and
Ferdinand Schmidt-Kaler was kind enough to provide a lot of
background information on the experiments `,(0,n.jsx)(u.a,{href:`#user-content-fnref-1`,"data-footnote-backref":``,"aria-label":`Back to reference 1`,className:`data-footnote-backref`,children:`↩`})]}),`
`]}),`
`]}),`
`]})]})}function f(e={}){let{wrapper:t}=e.components||{};return t?(0,n.jsx)(t,{...e,children:(0,n.jsx)(d,{...e})}):d(e)}export{f as default,u as frontmatter};