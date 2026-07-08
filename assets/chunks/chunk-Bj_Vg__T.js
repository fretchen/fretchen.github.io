import{Cn as e}from"./chunk-Bzf2rILe.js";import{t}from"./chunk-oyhCWECb2.js";var n=e(),r=`/assets/static/lecture19_pic1.DWTQplS1.png`,i=`/assets/static/lecture19_pic2.DM5gYrrV.png`,a=`/assets/static/lecture19_pic3.BFHPtpax.png`,o=`/assets/static/lecture19_pic4.DmMohLP1.png`,s=`/assets/static/lecture19_pic5.Bpdgi1AI.png`,c=`/assets/static/lecture19_pic6.2azzGp9_.png`,l={author:[`fretchen`,`Selim Jochim`,`Matthias Weidemüller`],order:19,title:`Lecture 19 - Atom-Light Interactions and Dressed States`};function u(e){let l={a:`a`,code:`code`,em:`em`,h1:`h1`,h2:`h2`,li:`li`,ol:`ol`,p:`p`,pre:`pre`,section:`section`,strong:`strong`,sup:`sup`,ul:`ul`,...e.components};return(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)(l.p,{children:`We have seen that we can understand matter with increasing complexity
from the simple two-level system up to molecules. We further studied,
how they can be control by classical electromagnetic fields to a very
high accuracy.`}),`
`,(0,n.jsxs)(l.p,{children:[`In the last lecture we also studied how we can understand the
electromagnetic field as an ensemble of quantum mechanical photon modes.
So in today's lecture we will focus on the interaction between atoms and
light, which is in a particularly clean set-up, namely cavity quantum
electrodynamics. The fundamental ingredients are sketched in Fig.
`,(0,n.jsx)(l.a,{href:`#fig-rydberg`,children:`1`}),`.`]}),`
`,(0,n.jsx)(t,{id:`fig-rydberg`,href:r,caption:`Rydberg atoms interacting with photons in a cavity`}),`
`,(0,n.jsx)(l.p,{children:`They are:`}),`
`,(0,n.jsxs)(l.ul,{children:[`
`,(0,n.jsxs)(l.li,{children:[`
`,(0,n.jsxs)(l.p,{children:[`The electric field confined in a high finesse cavity. It will
bescribed by `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`\\hat{H}_\\textrm{f}`}),`.`]}),`
`]}),`
`,(0,n.jsxs)(l.li,{children:[`
`,(0,n.jsxs)(l.p,{children:[`An atom transversing the cavity, described by `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`\\hat{H}_\\textrm{a}`}),`.`]}),`
`]}),`
`,(0,n.jsxs)(l.li,{children:[`
`,(0,n.jsxs)(l.p,{children:[`The interaction between the atomic charge and the electric field of
the cavity described by `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`\\hat{H}_\\textrm{af}`}),`.`]}),`
`]}),`
`]}),`
`,(0,n.jsx)(l.p,{children:`The Hamiltonian reads:`}),`
`,(0,n.jsx)(l.pre,{children:(0,n.jsx)(l.code,{className:`language-math math-display`,children:`
\\hat{H}_0 = \\hat{H}_\\textrm{a} + \\hat{H}_\\textrm{f} + \\hat{H}_\\textrm{af}`})}),`
`,(0,n.jsx)(l.h1,{children:`The qubit system`}),`
`,(0,n.jsx)(l.p,{children:`The first ingredient of the Hamiltonian is the qubit system. Several
widely studied system that we will come back to exist. The most widely
studied are:`}),`
`,(0,n.jsxs)(l.ol,{children:[`
`,(0,n.jsxs)(l.li,{children:[`
`,(0,n.jsx)(l.p,{children:`The internal qubit states of ions.`}),`
`]}),`
`,(0,n.jsxs)(l.li,{children:[`
`,(0,n.jsx)(l.p,{children:`The transmon qubit in superconducting systems.`}),`
`]}),`
`]}),`
`,(0,n.jsxs)(l.p,{children:[`Another approach are well isolated states in atoms, namely `,(0,n.jsx)(l.strong,{children:`Rydberg`}),`
states.`]}),`
`,(0,n.jsx)(l.h2,{children:`Rydberg atoms`}),`
`,(0,n.jsxs)(l.p,{children:[`The Rydberg states are highly excited states of Alkali atoms, which have
only one electron on the outer shell. As such they are similiar to the
hydrogen atom and hence they can be well described within atomic
physics. In the hydrogen atom the energy states are described by the
principle quantum number `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`n`}),`:`]}),`
`,(0,n.jsx)(l.pre,{children:(0,n.jsx)(l.code,{className:`language-math math-display`,children:`E_n = -E_I \\frac{1}{n^2} \\text{ with }E_I = 13.6 eV`})}),`
`,(0,n.jsxs)(l.p,{children:[`The typically employed Rydberg states are then in the
order of `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`n\\approx 50`}),`, such that the energy difference between two
neighboring states is in the order of a few 50 GHz. Focusing only on two
of those states we can write the Hamiltonian as:`]}),`
`,(0,n.jsx)(l.pre,{children:(0,n.jsx)(l.code,{className:`language-math math-display`,children:`\\hat{H}_\\textrm{a} = \\frac{\\hbar\\omega_0}{2} \\left(\\left|e\\right\\rangle\\left\\langle e\\right|-\\left|g\\right\\rangle\\left\\langle g\\right| \\right)`})}),`
`,(0,n.jsx)(l.p,{children:`Through the remainder of the lecture we will frequently
switch notations between the spin language and the two-level system:`}),`
`,(0,n.jsx)(l.pre,{children:(0,n.jsx)(l.code,{className:`language-math math-display`,children:`\\hat{\\sigma}_z = \\left|e\\right\\rangle\\left\\langle e\\right|-\\left|g\\right\\rangle\\left\\langle g\\right|\\\\
\\hat{\\sigma}_+ = \\left|e\\right\\rangle\\left\\langle g\\right|\\\\
\\hat{\\sigma}_- = \\left|g\\right\\rangle\\left\\langle e\\right|`})}),`
`,(0,n.jsx)(l.p,{children:`Using these highly excited states has several advantages:`}),`
`,(0,n.jsxs)(l.ul,{children:[`
`,(0,n.jsxs)(l.li,{children:[`
`,(0,n.jsx)(l.p,{children:`The energy spacing of a few GHz falls into the regime of microwaves,
which are extremely precisely controlled.`}),`
`]}),`
`,(0,n.jsxs)(l.li,{children:[`
`,(0,n.jsx)(l.p,{children:`Given the high quantum number, the electron is typically far away
from the nucleus and the induced dipole moments can be rather
large.As a such a strong coupling between light-field and qubit
seems achievable.`}),`
`]}),`
`,(0,n.jsxs)(l.li,{children:[`
`,(0,n.jsx)(l.p,{children:`The lifetime of the Rydberg states is in the order of a few
microseconds, which can be long compared to most other time scales
within the experiments.`}),`
`]}),`
`]}),`
`,(0,n.jsx)(l.p,{children:`The next step is to couple qubit to a suitable cavity.`}),`
`,(0,n.jsx)(l.h1,{children:`The cavity field`}),`
`,(0,n.jsx)(l.p,{children:`The atom has be coupled to a suitable electric field. The electric field
reads in general:`}),`
`,(0,n.jsx)(l.pre,{children:(0,n.jsx)(l.code,{className:`language-math math-display`,children:`\\hat{E}(\\vec{r})= i \\int \\frac{d\\vec{k}}{(2\\pi)^{3/2}}\\sum_i \\left(\\frac{\\hbar\\omega}{2\\epsilon_0}\\right)\\vec{e}_i\\left(\\hat{a}_i(\\vec{k})e^{i\\vec{k}\\vec{r}}-\\hat{a}^\\dag_i(\\vec{k})e^{-i\\vec{k}\\vec{r}}\\right)`})}),`
`,(0,n.jsx)(l.p,{children:`We can simplify it a lot by working in a suitable
cavity. The most important properties of the cavity are the:`}),`
`,(0,n.jsxs)(l.ul,{children:[`
`,(0,n.jsxs)(l.li,{children:[`
`,(0,n.jsxs)(l.p,{children:[`The resonant frequency `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`\\omega_L`}),` of the light trapped in the
cavity.`]}),`
`]}),`
`,(0,n.jsxs)(l.li,{children:[`
`,(0,n.jsxs)(l.p,{children:[`The quality factor `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`Q`}),`, which describes the number of round trips
the photon makes within the cavity.`]}),`
`]}),`
`]}),`
`,(0,n.jsxs)(l.p,{children:[`The cavities employed for cavity electrodynamics in Paris are made of
superconducting material and feature quality factors of up to `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`10^{10}`}),`.
For such high quality factors the electric field can be well reduced to
a single relevant mode `,(0,n.jsx)(l.sup,{children:(0,n.jsx)(l.a,{href:`#user-content-fn-1`,id:`user-content-fnref-1`,"data-footnote-ref":!0,"aria-describedby":`footnote-label`,children:`1`})}),`:`]}),`
`,(0,n.jsx)(l.pre,{children:(0,n.jsx)(l.code,{className:`language-math math-display`,children:`\\hat{E} \\sim (\\hat{a} + \\hat{a}^\\dag)`})}),`
`,(0,n.jsxs)(l.p,{children:[`The full Hamiltonian of the electromagnetic field reads
then `,(0,n.jsx)(l.sup,{children:(0,n.jsx)(l.a,{href:`#user-content-fn-2`,id:`user-content-fnref-2`,"data-footnote-ref":!0,"aria-describedby":`footnote-label`,children:`2`})}),`:`]}),`
`,(0,n.jsx)(l.pre,{children:(0,n.jsx)(l.code,{className:`language-math math-display`,children:`\\hat{H}_\\textrm{f} = \\hbar\\omega_L \\hat{a}^\\dag \\hat{a}`})}),`
`,(0,n.jsxs)(l.p,{children:[`The `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`\\hat{a}`}),` is the raising operator for the
electro-magnetic field. We typcially describe the electric field in the
Fock basis of `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`\\left|n\\right\\rangle`}),`.`]}),`
`,(0,n.jsx)(l.pre,{children:(0,n.jsx)(l.code,{className:`language-math math-display`,children:`\\hat{n} \\left|n\\right\\rangle = n \\left|n\\right\\rangle`})}),`
`,(0,n.jsx)(l.p,{children:`While is the natural choice for the given Hamiltonian,
this is obviously not the natural basis of the raising and lowering
operators:`}),`
`,(0,n.jsx)(l.pre,{children:(0,n.jsx)(l.code,{className:`language-math math-display`,children:`\\hat{a} \\left|n\\right\\rangle = \\sqrt{n} \\left|n-1\\right\\rangle\\\\
\\hat{a}^\\dag \\left|n\\right\\rangle = \\sqrt{n+1} \\left|n+1\\right\\rangle`})}),`
`,(0,n.jsx)(l.p,{children:`From those we can construct any Fock state as:`}),`
`,(0,n.jsx)(l.pre,{children:(0,n.jsx)(l.code,{className:`language-math math-display`,children:`\\left|n\\right\\rangle = \\frac{\\left(\\hat{a}^\\dag\\right)^n}{n!}\\left|0\\right\\rangle`})}),`
`,(0,n.jsxs)(l.p,{children:[`But experimentally we rarely manipulate the Hamiltonian
directly, we much rather control the electric field, which is
proportional to the raising and lowering operators. As such, photon
states are widely described in the basis of `,(0,n.jsx)(l.strong,{children:`coherent`}),` states:`]}),`
`,(0,n.jsx)(l.pre,{children:(0,n.jsx)(l.code,{className:`language-math math-display`,children:`\\hat{a}\\left|\\alpha\\right\\rangle= \\alpha\\left|\\alpha\\right\\rangle`})}),`
`,(0,n.jsx)(l.p,{children:`So the eigenvalues are complex numbers corresponding to
the complex electric field amplitudes we know from classical optics. To
make a connection to the Fock space we can then use the above
definitions to write:`}),`
`,(0,n.jsx)(l.pre,{children:(0,n.jsx)(l.code,{className:`language-math math-display`,children:`\\left|\\alpha\\right\\rangle =e^{-|\\alpha|^2/2}\\sum_n \\frac{\\alpha^n}{\\sqrt{n!}}\\left|n\\right\\rangle`})}),`
`,(0,n.jsxs)(l.p,{children:[`A very useful visualization of the coherent states
happens in phase space `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`X = \\frac{a+a^\\dag}{2}`}),` and
`,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`P = i\\frac{a-a^\\dag}{2}`}),`. They are Gaussian wave packages displaced by
an amplitude `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`|\\alpha|`}),` and rotating at speed `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`\\omega_L`}),`.`]}),`
`,(0,n.jsx)(l.h1,{children:`The atom-field interaction`}),`
`,(0,n.jsx)(l.p,{children:`Finally, we have to describe interaction between the atoms and the
field. Interactions between the atoms and the light field are governed
by the electric dipole interaction between the atom and the light`}),`
`,(0,n.jsx)(l.pre,{children:(0,n.jsx)(l.code,{className:`language-math math-display`,children:`\\hat{H}_\\textrm{af}= -\\hat{\\vec{D}} \\cdot \\hat{\\vec{E}}`})}),`
`,(0,n.jsx)(l.p,{children:`We can expand the dipole operator over the two levels of
the atom:`}),`
`,(0,n.jsx)(l.pre,{children:(0,n.jsx)(l.code,{className:`language-math math-display`,children:`\\hat{\\vec{D}} = \\vec{d}\\left(\\left|g\\right\\rangle\\left\\langle e\\right|+\\left|e\\right\\rangle\\left\\langle g\\right|\\right)\\\\
\\hat{\\vec{D}} = \\vec{d}\\left(\\hat{\\sigma}_- + \\hat{\\sigma}_+\\right)`})}),`
`,(0,n.jsx)(l.p,{children:`We can now write:`}),`
`,(0,n.jsx)(l.pre,{children:(0,n.jsx)(l.code,{className:`language-math math-display`,children:`\\hat{H}_\\textrm{af}= \\frac{\\hbar \\Omega_0}{2} \\left(\\left|g\\right\\rangle\\left\\langle e\\right|+\\left|e\\right\\rangle\\left\\langle g\\right|\\right)\\left(\\hat{a}+\\hat{a}^\\dag\\right)`})}),`
`,(0,n.jsx)(l.p,{children:`Multiplying out the different the two brackets leads to two processes of
the type:`}),`
`,(0,n.jsxs)(l.ul,{children:[`
`,(0,n.jsxs)(l.li,{children:[`
`,(0,n.jsxs)(l.p,{children:[(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`\\hat{\\sigma}_- \\hat{a}^\\dag`}),`, which describes the emission of a
photon by deexcitation of the atom.`]}),`
`]}),`
`,(0,n.jsxs)(l.li,{children:[`
`,(0,n.jsxs)(l.p,{children:[(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`\\hat{\\sigma}_+ \\hat{a}`}),`, which describes the absorption of a photon
by excitation of the atom.`]}),`
`]}),`
`]}),`
`,(0,n.jsx)(l.p,{children:`The other two processes are strongly off-resonant and we can typically
ignore them. This approximation consists in the rotating wave
approximation, discussed in lecture 4. The coupling
hamiltonian reads then:`}),`
`,(0,n.jsx)(l.pre,{children:(0,n.jsx)(l.code,{className:`language-math math-display`,children:`\\hat{H}_\\textrm{af}= \\frac{\\hbar \\Omega_0}{2} \\left(\\hat{\\sigma}_- a^\\dag +\\hat{\\sigma}_+ a\\right)`})}),`
`,(0,n.jsx)(l.p,{children:`We can put the full Hamiltonian together to obtain the Jaynes-Cummings
model:`}),`
`,(0,n.jsx)(l.pre,{children:(0,n.jsx)(l.code,{className:`language-math math-display`,children:`H_{JC}=\\hbar\\omega_0 \\left|e\\right\\rangle\\left\\langle e\\right| +\\hbar\\omega_L \\hat{a}^\\dag \\hat{a} +\\frac{\\hbar \\Omega_0}{2} \\left(\\hat{\\sigma}_- a^\\dag +\\hat{\\sigma}_+ a\\right)`})}),`
`,(0,n.jsx)(l.h1,{children:`Dressed Atom Picture`}),`
`,(0,n.jsx)(l.p,{children:`We can now analyze the Hamiltonian step-by-step in the dressed atom
picture.`}),`
`,(0,n.jsx)(l.h2,{children:`Optional: Bare States`}),`
`,(0,n.jsxs)(l.p,{children:[`Let us first look at the unperturbed ("bare") states, ignoring
`,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`H_\\textrm{af}`}),` and depict the ground and excited state
`,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`\\left|g\\right\\rangle`}),` and
`,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`\\left|e\\right\\rangle`}),` of the atom on an energy scale, as
shown in below.`]}),`
`,(0,n.jsx)(t,{id:`fig-rydberg`,href:i,caption:`The ground and excited state $\\left|g\\right\\rangle$ and $\\left|e\\right\\rangle$ of the atom on an energy scale. Here, the energy of the ground state is $E_g = 0$. The energy difference between the two states is $\\hbar\\omega_0$. A photon of the surrounding light field has an energy $\\hbar\\omega_L$.`}),`
`,(0,n.jsx)(l.pre,{children:(0,n.jsx)(l.code,{className:`language-math math-display`,children:`\\hat{H} = \\hat{H}_\\textrm{a} + \\hat{H}_\\textrm{f} = \\hbar \\omega_0 \\left|e\\right\\rangle \\left\\langle e\\right| + \\hbar \\omega_\\textrm{L} \\hat{a}^\\dag \\hat{a}`})}),`
`,(0,n.jsx)(l.p,{children:`The Hilbert space of this Hamiltonian contains both the state of the
atom and the state of the field. We can write them as product states of
the form`}),`
`,(0,n.jsx)(l.pre,{children:(0,n.jsx)(l.code,{className:`language-math math-display`,children:`\\left|g/e, n\\right\\rangle = \\left|g/e\\right\\rangle \\otimes \\left|n\\right\\rangle`})}),`
`,(0,n.jsx)(l.p,{children:`The left substate of the tensor product denotes the
state of the atom and the right substate is defined by the number of
photons in the external field. We then have:`}),`
`,(0,n.jsx)(l.pre,{children:(0,n.jsx)(l.code,{className:`language-math math-display`,children:`\\hat{H}\\left|g/e, n\\right\\rangle = \\left(\\hbar\\omega_0 \\delta_{g/e,e}+\\hbar\\omega_L n\\right)\\left|g/e, n\\right\\rangle`})}),`
`,(0,n.jsxs)(l.p,{children:[`We will assume that there is a very small detuning `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`\\delta_\\textrm{l}`}),`
between the atom and the light field:`]}),`
`,(0,n.jsx)(l.pre,{children:(0,n.jsx)(l.code,{className:`language-math math-display`,children:`|\\delta_\\textrm{l}| = |\\omega_\\textrm{L}- \\omega_0 | \\ll \\omega_0`})}),`
`,(0,n.jsx)(t,{id:`fig-bare-diagram`,href:a,caption:`An energy diagram of the bare states. Note that the interaction between atom and light field has not yet been introduced!`}),`
`,(0,n.jsxs)(l.p,{children:[`We can draw another energy diagram (see
`,(0,n.jsx)(l.a,{href:`#fig-bare-diagram`,children:`3`}),`), where the state
of the atom and the state of the light field are contained in one "bare"
state. It does `,(0,n.jsx)(l.em,{children:`not`}),` yet include the interaction between the atom and
the light field. From the diagram one can see that the states forming
the manifold`]}),`
`,(0,n.jsx)(l.pre,{children:(0,n.jsx)(l.code,{className:`language-math math-display`,children:`\\Sigma (n) = \\left\\{ \\left|g,n+1\\right\\rangle, \\left|e,n\\right\\rangle \\right\\}`})}),`
`,(0,n.jsx)(l.p,{children:`are almost degenerate.`}),`
`,(0,n.jsx)(l.h2,{children:`Dressed States`}),`
`,(0,n.jsxs)(l.p,{children:[(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`\\hat{H}_\\textrm{af}`}),` couples now only the two states within each
manifold
`,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`\\Sigma(n)= \\left\\{ \\left|g,n+1\\right\\rangle, \\left|e,n\\right\\rangle \\right\\}`}),`.
We thus obtain a two-state system (see lecture 3) for
which we can write:`]}),`
`,(0,n.jsx)(l.pre,{children:(0,n.jsx)(l.code,{className:`language-math math-display`,children:`\\left( \\begin{array}{c} c_1 \\\\ c_2 \\end{array} \\right) \\equiv c_1 \\left|g,n+1\\right\\rangle + c_2 \\left|e,n\\right\\rangle`})}),`
`,(0,n.jsx)(l.p,{children:`The off-diagonal matric element reads:`}),`
`,(0,n.jsx)(l.pre,{children:(0,n.jsx)(l.code,{className:`language-math math-display`,children:`h_n = \\left\\langle e,n|\\hat{H_\\textrm{af}|g,n+1}\\right\\rangle = \\frac{\\hbar \\Omega_0}{2} \\sqrt{n+1}.`})}),`
`,(0,n.jsxs)(l.p,{children:[`Note that the square of the matrix element is
proportional to `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`I \\propto (n+1) \\approx n`}),` for large `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`n`}),`. The three
Hamiltonians can then be written in matrix notation and the
total Hamiltonian can be constructed:`]}),`
`,(0,n.jsx)(l.pre,{children:(0,n.jsx)(l.code,{className:`language-math math-display`,children:`H_\\textrm{a} = \\left( \\begin{array}{cc} 0 & 0 \\\\ 0 & \\hbar \\omega_0 \\end{array} \\right),\\\\
H_\\textrm{f} = \\left( \\begin{array}{cc} (n+1)\\hbar \\omega_\\textrm{l} & 0 \\\\ 0 & n \\hbar \\omega_\\textrm{l} \\end{array} \\right) =  \\left( \\begin{array}{cc} \\hbar \\omega_\\textrm{l} & 0 \\\\ 0 & 0 \\end{array} \\right) + n \\hbar \\omega_\\textrm{l} \\cdot \\mathbb{1},\\\\
H_\\textrm{af} = \\left( \\begin{array}{cc} 0 & h_n \\\\ h_n & 0 \\end{array} \\right), \\qquad \\text{where} \\qquad h_n = \\hbar \\frac{\\Omega_0}{2}\\sqrt{n+1},\\\\
\\hat{H} = \\left( \\begin{array}{cc} \\hbar \\omega_\\textrm{l} & h_n \\\\ h_n & \\hbar \\omega_0 \\end{array} \\right) + n \\hbar \\omega_\\textrm{l} \\cdot \\mathbb{1},`})}),`
`,(0,n.jsxs)(l.p,{children:[`The "dressed states" are obtained by diagonalizing
`,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`\\hat{H}`}),` within `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`\\Sigma(n)`}),`, which es effectively once again a two
level system `,(0,n.jsx)(l.a,{href:`#fig-dressed-diagram`,children:`4`}),` shows
an energy diagram including the bare and the dressed states. The energy
difference between the states `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`\\left|1(n)\\right\\rangle`}),` and
`,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`\\left|2(n)\\right\\rangle`}),` is`]}),`
`,(0,n.jsx)(l.pre,{children:(0,n.jsx)(l.code,{className:`language-math math-display`,children:`\\hbar \\Omega = \\hbar \\sqrt{\\delta_\\textrm{l}^2 + \\Omega_0^2}`})}),`
`,(0,n.jsxs)(l.p,{children:[`with the effective Rabi frequency `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`\\Omega`}),`.`]}),`
`,(0,n.jsx)(t,{id:`fig-dressed-diagram`,href:o,caption:`An energy diagram showing the bare and the dressed states.`}),`
`,(0,n.jsx)(l.p,{children:`The corresponding eigenvectors are then a mixture of atom and light as
visualized in the figure below.`}),`
`,(0,n.jsx)(t,{id:`fig-dressed-energies`,href:s,caption:`Energies of the bare and dressed states as a function of the detuning.`}),`
`,(0,n.jsx)(l.h1,{children:`Quantum Rabi oscillations`}),`
`,(0,n.jsx)(l.p,{children:`In the resonant case, the Jaynes-Cummings model simply describes a
two-level system that is coupled by a quantized Rabi coupling strength`}),`
`,(0,n.jsx)(l.pre,{children:(0,n.jsx)(l.code,{className:`language-math math-display`,children:`\\Omega_n = \\Omega_0 \\sqrt{n+1}`})}),`
`,(0,n.jsx)(l.p,{children:`So even for an empty cavity the vacuum is predicted to
induce Rabi coupling, if it is switched on and off. If more than one
photon is in the cavity the oscillation is simply a superposition of
several coupling strength:`}),`
`,(0,n.jsx)(l.pre,{children:(0,n.jsx)(l.code,{className:`language-math math-display`,children:`P_e(t)=\\sum_n p_n\\frac{1+\\cos\\left[\\Omega_n t\\right]}{2}`})}),`
`,(0,n.jsxs)(l.p,{children:[`This effect has been observed in Ref. `,(0,n.jsx)(l.a,{href:`http://dx.doi.org/10.1103/physrevlett.76.1800`,children:`Brune 1996`}),` as
summarized in Fig. `,(0,n.jsx)(l.a,{href:`#fig-coherence`,children:`6`}),`.`]}),`
`,(0,n.jsx)(t,{id:`fig-coherence`,href:c,caption:`Observation of quantum Rabi oscillations in [Brune 1996](http://dx.doi.org/10.1038/22275).`}),`
`,(0,n.jsx)(l.h1,{children:`Making Schrödingers kitten`}),`
`,(0,n.jsxs)(l.p,{children:[`In the previous section the cavity was tuned exactly on resonance with
the incoming Rydberg atoms, such that coherent oscillations where
possible. On the other hand it is possible to work in the regime, where
`,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`\\delta_L`}),` is much larger than the Rabi coupling. In this 'dispersive'
regime the atom does not change its internal state, but it only picks up
a phase `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`\\Phi_0 =  \\frac{\\delta_L^2}{4\\Omega} T_R`}),`. The inverse of the
phase is then imprinted onto the electric field in the cavity. To create
a kitten state the experiment goes as follows:`]}),`
`,(0,n.jsxs)(l.ol,{children:[`
`,(0,n.jsxs)(l.li,{children:[`
`,(0,n.jsxs)(l.p,{children:[`The cavity is filled by a coherent state `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`\\alpha`}),`.`]}),`
`]}),`
`,(0,n.jsxs)(l.li,{children:[`
`,(0,n.jsxs)(l.p,{children:[`The Rydberg atom is prepare in a superposition state
`,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`\\frac{\\left|e\\right\\rangle+\\left|g\\right\\rangle}{\\sqrt{2}}`})]}),`
`]}),`
`,(0,n.jsxs)(l.li,{children:[`
`,(0,n.jsxs)(l.p,{children:[`The atom now interacts with the cavity for the time `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`T_R`}),`. At the
end, the entangled state is created:`]}),`
`]}),`
`]}),`
`,(0,n.jsx)(l.pre,{children:(0,n.jsx)(l.code,{className:`language-math math-display`,children:`\\left|\\Psi\\right\\rangle_1= \\frac{e^{-i\\Phi_0}\\left|e, \\alpha e^{-i\\Phi_0}\\right\\rangle+\\left|g,\\alpha e^{i\\Phi_0}\\right\\rangle}{\\sqrt{2}}`})}),`
`,(0,n.jsxs)(l.p,{children:[`This is the typical situation of Scrödingers cat.
Pushing to the extreme case `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`\\Phi_0 = \\frac{\\pi}{2}`}),` we entangled the
atom with the state `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`\\left|\\pm i\\alpha\\right\\rangle`}),`. As
`,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`\\alpha`}),` is a complex number we entangled a single atom with a large
'cat' state. As the atom is detected it projects the full Schrödinger
cat onto the dead or alive state. This projection can be avoided by
adding a second Ramsey pulse, which mixes once again the states
`,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`\\left|e\\right\\rangle`}),` and
`,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`\\left|g\\right\\rangle`}),`:`]}),`
`,(0,n.jsx)(l.pre,{children:(0,n.jsx)(l.code,{className:`language-math math-display`,children:`\\left|e\\right\\rangle\\rightarrow\\frac{\\left|e\\right\\rangle+e^{i\\varphi}\\left|g\\right\\rangle}{\\sqrt{2}}\\\\
\\left|g\\right\\rangle\\rightarrow\\frac{\\left|g\\right\\rangle-e^{-i\\varphi}\\left|e\\right\\rangle}{\\sqrt{2}}`})}),`
`,(0,n.jsx)(l.p,{children:`The field now becomes:`}),`
`,(0,n.jsx)(l.pre,{children:(0,n.jsx)(l.code,{className:`language-math math-display`,children:`\\left|\\Psi_2\\right\\rangle = \\frac{1}{2}\\left|e\\right\\rangle\\otimes\\left[e^{-i\\Phi_0}\\left|\\alpha e^{-i\\Phi_0}\\right\\rangle-e^{-i\\varphi}\\left|\\alpha e^{i\\Phi_0}\\right\\rangle\\right]+\\frac{1}{2}\\left|g\\right\\rangle\\otimes\\left[e^{i(\\varphi-\\Phi_0)}\\left|\\alpha e^{-i\\Phi_0}\\right\\rangle+\\left|\\alpha e^{i\\Phi_0}\\right\\rangle\\right]`})}),`
`,(0,n.jsx)(l.p,{children:`The final read-out is then given by:`}),`
`,(0,n.jsx)(l.pre,{children:(0,n.jsx)(l.code,{className:`language-math math-display`,children:`P_e = \\frac{1}{2}\\left(1- e^{-n(1-\\cos(2\\Phi_0))}\\cos(\\varphi-\\Phi_0-n\\sin(2\\Phi_0))\\right)`})}),`
`,(0,n.jsx)(l.p,{children:`So the presence of the cat leads to a phase shift and a
decrease in fringe contrast. This was observed in the experiments`}),`
`,(0,n.jsx)(l.h1,{children:`Making Schrödingers kitten`}),`
`,(0,n.jsxs)(l.p,{children:[`In the previous section the cavity was tuned exactly on resonance with
the incoming Rydberg atoms, such that coherent oscillations where
possible. On the other hand it is possible to work in the regime, where
`,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`\\delta_L`}),` is much larger than the Rabi coupling. In this 'dispersive'
regime the atom does not change its internal state, but it only picks up
a phase `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`\\Phi_0 =  \\frac{\\delta_L^2}{4\\Omega} T_R`}),`. The inverse of the
phase is then imprinted onto the electric field in the cavity. To create
a kitten state the experiment goes as follows:`]}),`
`,(0,n.jsxs)(l.ol,{children:[`
`,(0,n.jsxs)(l.li,{children:[`
`,(0,n.jsxs)(l.p,{children:[`The cavity is filled by a coherent state `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`\\alpha`}),`.`]}),`
`]}),`
`,(0,n.jsxs)(l.li,{children:[`
`,(0,n.jsxs)(l.p,{children:[`The Rydberg atom is prepare in a superposition state
`,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`\\frac{\\left|e\\right\\rangle+\\left|g\\right\\rangle}{\\sqrt{2}}`})]}),`
`]}),`
`,(0,n.jsxs)(l.li,{children:[`
`,(0,n.jsxs)(l.p,{children:[`The atom now interacts with the cavity for the time `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`T_R`}),`. At the
end, the entangled state is created:`]}),`
`]}),`
`]}),`
`,(0,n.jsx)(l.pre,{children:(0,n.jsx)(l.code,{className:`language-math math-display`,children:`\\left|\\Psi\\right\\rangle_1= \\frac{e^{-i\\Phi_0}\\left|e, \\alpha e^{-i\\Phi_0}\\right\\rangle+\\left|g,\\alpha e^{i\\Phi_0}\\right\\rangle}{\\sqrt{2}}`})}),`
`,(0,n.jsxs)(l.p,{children:[`This is the typical situation of Scrödingers cat.
Pushing to the extreme case `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`\\Phi_0 = \\frac{\\pi}{2}`}),` we entangled the
atom with the state `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`\\left|\\pm i\\alpha\\right\\rangle`}),`. As
`,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`\\alpha`}),` is a complex number we entangled a single atom with a large
'cat' state. As the atom is detected it projects the full Schrödinger
cat onto the dead or alive state. This projection can be avoided by
adding a second Ramsey pulse, which mixes once again the states
`,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`\\left|e\\right\\rangle`}),` and
`,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`\\left|g\\right\\rangle`}),`:`]}),`
`,(0,n.jsx)(l.pre,{children:(0,n.jsx)(l.code,{className:`language-math math-display`,children:`\\left|e\\right\\rangle\\rightarrow\\frac{\\left|e\\right\\rangle+e^{i\\varphi}\\left|g\\right\\rangle}{\\sqrt{2}}\\\\
\\left|g\\right\\rangle\\rightarrow\\frac{\\left|g\\right\\rangle-e^{-i\\varphi}\\left|e\\right\\rangle}{\\sqrt{2}}`})}),`
`,(0,n.jsx)(l.p,{children:`The field now becomes:`}),`
`,(0,n.jsx)(l.pre,{children:(0,n.jsx)(l.code,{className:`language-math math-display`,children:`\\left|\\Psi_2\\right\\rangle = \\frac{1}{2}\\left|e\\right\\rangle\\otimes\\left[e^{-i\\Phi_0}\\left|\\alpha e^{-i\\Phi_0}\\right\\rangle-e^{-i\\varphi}\\left|\\alpha e^{i\\Phi_0}\\right\\rangle\\right]+\\frac{1}{2}\\left|g\\right\\rangle\\otimes\\left[e^{i(\\varphi-\\Phi_0)}\\left|\\alpha e^{-i\\Phi_0}\\right\\rangle+\\left|\\alpha e^{i\\Phi_0}\\right\\rangle\\right]`})}),`
`,(0,n.jsx)(l.p,{children:`The final read-out is then given by:`}),`
`,(0,n.jsx)(l.pre,{children:(0,n.jsx)(l.code,{className:`language-math math-display`,children:`P_e = \\frac{1}{2}\\left(1- e^{-n(1-\\cos(2\\Phi_0))}\\cos(\\varphi-\\Phi_0-n\\sin(2\\Phi_0))\\right)`})}),`
`,(0,n.jsx)(l.p,{children:`So the presence of the cat leads to a phase shift and a
decrease in fringe contrast.`}),`
`,(0,n.jsx)(l.p,{children:`Nowadays the entangled states have become an interesting platform to
create increasingly large Schrödinger cats. A common example is here the
creation of a GHZ state:`}),`
`,(0,n.jsx)(l.pre,{children:(0,n.jsx)(l.code,{className:`language-math math-display`,children:`\\left|\\psi\\right\\rangle = \\frac{\\left|0 \\cdots 0\\right\\rangle+ \\left|1\\cdots 1\\right\\rangle}{\\sqrt{2}}`})}),`
`,(0,n.jsxs)(l.p,{children:[`A interesting demonstration for up to 14 ions was performed in
`,(0,n.jsx)(l.a,{href:`https://journals.aps.org/prl/abstract/10.1103/PhysRevLett.106.130506`,children:`Monz 2011`}),`. Importantly it also highlights the extremely fast decoherence of larger cat states. We will go into more detail on how to
create increasingly larger cats in the next lecture. However, I would
like to finish the lecture with the discussion of quantum non-demolition
measurements.`]}),`
`,(0,n.jsxs)(l.p,{children:[`As of the time of writing cold atom systems systems `,(0,n.jsx)(l.a,{href:`https://arxiv.org/abs/1905.05721`,children:`rOmran 2019`}),` cold
the record of the largest cat with 20 atoms.`]}),`
`,(0,n.jsx)(l.h1,{children:`Seeing a photon without destroying it`}),`
`,(0,n.jsxs)(l.p,{children:[`The tool of the Rabi oscillations has been extend to observe photons
without destroying them as detailed in great detail in the book by
`,(0,n.jsx)(l.a,{href:`https://academic.oup.com/book/7346`,children:`Raymond and Haroche`}),`. The underlying principle is the
following:`]}),`
`,(0,n.jsxs)(l.ul,{children:[`
`,(0,n.jsxs)(l.li,{children:[`
`,(0,n.jsx)(l.p,{children:`The atom is supposed to be in the ground state and the cavity is
filled with one photon.`}),`
`]}),`
`,(0,n.jsxs)(l.li,{children:[`
`,(0,n.jsx)(l.p,{children:`The interaction time is tuned such that the atom undergoes exactly
one Rabi oscillation.`}),`
`]}),`
`,(0,n.jsxs)(l.li,{children:[`
`,(0,n.jsxs)(l.p,{children:[`The initial and final state are therefore exactly the same, but the
atom has picked up a phase `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`\\pi`}),`.`]}),`
`]}),`
`]}),`
`,(0,n.jsx)(l.p,{children:`If the cavity was empty at the atom does not acquire a phase shift.`}),`
`,(0,n.jsxs)(l.p,{children:[`Finally, the phase is read out through a Ramsey sequence between the
state `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`g`}),` and some unaffected independent state `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`i`}),` . This was implemented in Ref. `,(0,n.jsx)(l.a,{href:`http://dx.doi.org/10.1038/22275`,children:`Nogues 1999`}),`. Based on this technique,
the team later observed quantum jumps `,(0,n.jsx)(l.a,{href:`http://dx.doi.org/10.1038/nature05589`,children:`Gleyzes 2007`}),` and even the
stabilization of a Fock state through quantum feedback `,(0,n.jsx)(l.a,{href:`http://dx.doi.org/10.1038/nature10376`,children:`Sayrin 2011`}),`.`]}),`
`,(0,n.jsxs)(l.section,{"data-footnotes":!0,className:`footnotes`,children:[(0,n.jsx)(l.h2,{className:`sr-only`,id:`footnote-label`,children:`Footnotes`}),`
`,(0,n.jsxs)(l.ol,{children:[`
`,(0,n.jsxs)(l.li,{id:`user-content-fn-1`,children:[`
`,(0,n.jsxs)(l.p,{children:[`We chose the phase of the electric field such that we can
eliminate the minus sign in the Hamiltonian `,(0,n.jsx)(l.a,{href:`#user-content-fnref-1`,"data-footnote-backref":``,"aria-label":`Back to reference 1`,className:`data-footnote-backref`,children:`↩`})]}),`
`]}),`
`,(0,n.jsxs)(l.li,{id:`user-content-fn-2`,children:[`
`,(0,n.jsxs)(l.p,{children:[`We ignore the energy of the quantum vacuum as it is not relevant
for the following discussions `,(0,n.jsx)(l.a,{href:`#user-content-fnref-2`,"data-footnote-backref":``,"aria-label":`Back to reference 2`,className:`data-footnote-backref`,children:`↩`})]}),`
`]}),`
`]}),`
`]})]})}function d(e={}){let{wrapper:t}=e.components||{};return t?(0,n.jsx)(t,{...e,children:(0,n.jsx)(u,{...e})}):u(e)}export{d as default,l as frontmatter};