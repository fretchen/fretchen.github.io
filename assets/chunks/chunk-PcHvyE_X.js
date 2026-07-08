import{kn as e}from"./chunk-DCq2tb4F.js";import{t}from"./chunk-CDRG_CNZ2.js";var n=e(),r=`/assets/static/lecture15_pic1.B8vYRwYc.png`,i=`/assets/static/lecture15_pic2.DTc86Kr0.png`,a=`/assets/static/lecture15_pic3.C9lZlEqs.svg`,o=`/assets/static/lecture15_pic4.CvQrmW7o.svg`,s={author:[`fretchen`,`Selim Jochim`,`Matthias Weidemüller`],order:15,title:`Lecture 15 - Diatomic molecules`};function c(e){let s={a:`a`,code:`code`,em:`em`,h1:`h1`,h2:`h2`,li:`li`,ol:`ol`,p:`p`,pre:`pre`,strong:`strong`,ul:`ul`,...e.components};return(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)(s.p,{children:`In this lecture we will start to put atoms together to build simple
molecules. We will first use the Born-Oppenheimer approximation, to
eliminate slow processes from the study of the fast electron dynamics.
Then, we will study simple mechanisms of binding atoms.`}),`
`,(0,n.jsx)(s.h1,{children:`Introduction`}),`
`,(0,n.jsx)(s.p,{children:`Molecules add a new layer of complexity to the system. In atoms, we had
different combinations of nuclei and electrons, leading to different
kinds of atoms. In this lecture, we will use atoms as basic building
block of more complex structures, the molecules. While this complexity
makes it necessary to introduce new approximations, it also allows us to
study new processes in nature.`}),`
`,(0,n.jsxs)(s.p,{children:[`So we will start out with the simplest of all molecules, barely a
molecule, the `,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`H_2^+`}),` ion. We start out with a discussion of the
Born-Oppenheimer approximation. Detailled discussions can be found in
`,(0,n.jsx)(s.a,{href:`https://books.google.de/books?id=9KEPAQAAMAAJ`,children:`Chapter 8 of Atkins`}),`, `,(0,n.jsx)(s.a,{href:`http://dx.doi.org/10.1007/978-3-642-10298-1`,children:`Chapter 9 of Demtröder`}),` and
`,(0,n.jsx)(s.a,{href:`https://books.google.de/books?id=i5IPWXDQlcIC`,children:`Chapter 10 of Bransden`}),`.`]}),`
`,(0,n.jsx)(s.h1,{children:`Molecular hydrogen ion`}),`
`,(0,n.jsxs)(s.p,{children:[`In molecular hydrogen we have only three ingredients. A single electron,
which is bound to two nuclei as shown in Fig.
`,(0,n.jsx)(s.a,{href:`#fig-hydrogen-ion`,children:`1`}),`.`]}),`
`,(0,n.jsx)(t,{id:`fig-hydrogen-ion`,href:r,caption:`The molecular hydrogen ion`}),`
`,(0,n.jsx)(s.p,{children:`The full Hamiltonian of the system at study would read:`}),`
`,(0,n.jsxs)(s.p,{children:[(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`\\hat{H} = - \\frac{1}{2}\\nabla_\\mathbf{r}^2 - \\frac{1}{2M}\\left(\\nabla_{\\mathbf{R}_\\mathrm{A}}^2 +\\nabla_{\\mathbf{R}_\\mathrm{B}}^2\\right) + V(\\mathbf{r}, \\mathbf{R}_\\mathrm{A}, \\mathbf{R}_\\mathrm{B})`}),`
We will further introduce the short-hand notations:`]}),`
`,(0,n.jsx)(s.pre,{children:(0,n.jsx)(s.code,{className:`language-math math-display`,children:`\\hat{T}_e = - \\frac{1}{2}\\nabla_\\mathbf{r}^2 \\\\
\\hat{T}_n = - \\frac{1}{2M}\\left(\\nabla_{\\mathbf{R}_\\mathrm{A}}^2 +\\nabla_{\\mathbf{R}_\\mathrm{B}}^2\\right)`})}),`
`,(0,n.jsx)(s.p,{children:`In a stark difference to atoms, we now have two charged nuclei. The
relative distance between them and between the electron will be of major
importance. Most importantly, we should answer the question, why this
configuration should be stable at all given that the two protons repel
each other. To handle the problem, we will once again separate out
energy scales.`}),`
`,(0,n.jsx)(s.h2,{children:`The Born-Oppenheimer approximation`}),`
`,(0,n.jsxs)(s.p,{children:[`The idea of the `,(0,n.jsx)(s.strong,{children:`Born-Oppenheimer approximation`}),` is to separate the
fast electronic motion from the slow motion of the heavy nuclueus
(`,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`M=1836`}),`). So we will`]}),`
`,(0,n.jsxs)(s.ol,{children:[`
`,(0,n.jsxs)(s.li,{children:[`
`,(0,n.jsx)(s.p,{children:`Solve the electronic motion with the nuclear coordinates fixed.`}),`
`]}),`
`,(0,n.jsxs)(s.li,{children:[`
`,(0,n.jsx)(s.p,{children:`Solve the nuclear motion, assuming that the electron wavefunction
adapts instantaneously.`}),`
`]}),`
`]}),`
`,(0,n.jsxs)(s.p,{children:[`So the ansatz is:
`,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`\\Psi(\\mathbf{R}_\\mathrm{A}, \\mathbf{R}_\\mathrm{B}, \\mathbf{r}) = \\psi_e(\\mathbf{R}_\\mathrm{A}, \\mathbf{R}_\\mathrm{B}, \\mathbf{r})\\cdot \\psi_n(\\mathbf{R}_\\mathrm{A}, \\mathbf{R}_\\mathrm{B})`})]}),`
`,(0,n.jsxs)(s.p,{children:[`We will plug this into the Schrödinger equation to obtain:
`,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`\\psi_n\\hat{T}_e\\psi_e +\\psi_e\\hat{T}_n\\psi_n + V(\\mathbf{r}, \\mathbf{R}_\\mathrm{A}, \\mathbf{R}_\\mathrm{B})\\psi_e \\psi_n + W = E \\psi_e\\psi_n`})]}),`
`,(0,n.jsxs)(s.p,{children:[`This transformation introduced the `,(0,n.jsx)(s.em,{children:`non-adiabatic`}),` effects:
`,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`W = -\\frac{1}{2M}\\sum_{i=A,B} \\left[(\\nabla_{\\mathbf{R}_i}\\psi_e)\\cdot(\\nabla_{\\mathbf{R}_i}\\psi_n)+\\psi_n \\nabla_{\\mathbf{R}_i}^2 \\psi_e\\right]`})]}),`
`,(0,n.jsxs)(s.p,{children:[`In the following we will neglect these effects. And obtain:
`,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`\\psi_e \\hat{T}_n\\psi_n + \\left(\\hat{T}_e\\psi_e+V\\psi_e\\right)\\psi_n = E \\psi_e\\psi_n`}),`
So we will first solve the `,(0,n.jsx)(s.em,{children:`electronic motion`}),`:
`,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`\\left(\\hat{T}_e+\\hat{V}\\right)\\psi_e = E_e(\\mathbf{R}_\\mathrm{A}, \\mathbf{R}_\\mathrm{B}) \\psi_e`}),`
To be explicit we obtain for the ionic hydrogen:`]}),`
`,(0,n.jsx)(s.pre,{children:(0,n.jsx)(s.code,{className:`language-math math-display`,children:`
H_e = -\\frac{1}{2} \\nabla_\\mathbf{r}^2-\\frac{1}{r_A}-\\frac{1}{r_B}+\\frac{1}{R}`})}),`
`,(0,n.jsxs)(s.p,{children:[`At this stage we can just focus on the electronic part to understand the
structure of simple diatomic molecules, while assuming that `,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`R`}),` is an
independent parameter. Most importantly, we will focus at usual on
symmetries, which will tell us more about the allowed states in the
system.`]}),`
`,(0,n.jsxs)(s.p,{children:[`In the second step we will solve the nuclear motion:
`,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`\\hat{T}_n\\psi_n + E_e \\psi_n = E \\psi_n`})]}),`
`,(0,n.jsx)(s.p,{children:`This nuclear motion will be at the origin of rotational and vibrational
levels, which will be discussed in on of the next lectures.`}),`
`,(0,n.jsx)(s.h1,{children:`Symmetries of the electronic wavefunction`}),`
`,(0,n.jsx)(s.p,{children:`This discussion follows along similiar lines as for the hydrogen atom
and the helium atom. We basically can categorize the different states by
their properties. This will help us later enormously to understand
allowed transition etc.`}),`
`,(0,n.jsx)(s.h2,{children:`Angular momentum`}),`
`,(0,n.jsx)(s.p,{children:`For any (diatomic) molecule we break the spherical symmetry that we
relied on for the atomic systems. This means that angular momentum is
not a conserved quantity anymore.`}),`
`,(0,n.jsx)(s.p,{children:`However, the full Hamiltonian is invariant under the rotation around the
axis of the diatomic molecule. One can verify that this implies that:`}),`
`,(0,n.jsx)(s.pre,{children:(0,n.jsx)(s.code,{className:`language-math math-display`,children:`[H_e, L_z] = 0\\\\
\\Rightarrow L_z \\psi_e = \\pm \\Lambda \\psi_e (a.u.)`})}),`
`,(0,n.jsxs)(s.p,{children:[`The reason is that
`,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`\\hat{L}_z =\\frac{1}{i}\\partial_\\varphi`}),` depends solely on the angle
`,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`\\varphi`}),` and not on `,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`R`}),`. Here the quantum number can have the integer
values `,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`\\Lambda= 0, 1, 2 , \\cdots`}),`. We also note them
`,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`\\Sigma, \\Pi, \\Delta, \\Phi`}),` or `,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`\\sigma, \\pi, \\delta, \\phi`}),` for single
electrons.`]}),`
`,(0,n.jsx)(s.h2,{children:`Parity`}),`
`,(0,n.jsxs)(s.p,{children:[`We further have symmetry under parity operation for `,(0,n.jsx)(s.em,{children:`homo-nuclear,
diatomic`}),` molecules `,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`A_2`}),`. This means that we have once more:
`,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`\\hat{P}\\psi_e(\\mathbf{r}) = \\pm\\psi_e(\\mathbf{r})`}),` In the same way as
in the lecture on the Helium atom we distinguish the states by `,(0,n.jsx)(s.em,{children:`gerade`}),`
and `,(0,n.jsx)(s.em,{children:`ungerade`}),`. So we then end up with something like
`,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`\\Lambda_{u,g}^\\pm`}),`.`]}),`
`,(0,n.jsx)(s.h2,{children:`Spin`}),`
`,(0,n.jsxs)(s.p,{children:[`If the system does not have explicit spin-orbit coupling, the total spin
`,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`S`}),` of the system will be conserved. So the full notation for electronic
states is typically: `,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`^{2S+1}\\Lambda^{\\pm}_{g,u}`}),` Most of the time the
ground state of the system is `,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`^{1}\\Sigma^{+}_{g}`}),`.`]}),`
`,(0,n.jsx)(s.h1,{children:`Stability of the ground state molecule`}),`
`,(0,n.jsxs)(s.p,{children:[`We have now studied the symmetries that the system should have, but
until now we did not discuss the most important question: Is this
molecule stable ? Within the Born-Oppenheimer approximation, we can
actually solve the ionic hydrogen molecule analytically (see `,(0,n.jsx)(s.a,{href:`http://dx.doi.org/10.1007/978-3-642-10298-1`,children:`Chapter 9 of
Demtröder`}),`). The resulting `,(0,n.jsx)(s.strong,{children:`molecular potential curves`}),` are
shown in Fig. `,(0,n.jsx)(s.a,{href:`#fig-potentials`,children:`2`}),`.`]}),`
`,(0,n.jsx)(t,{id:`fig-potentials`,href:i,caption:`Molecular potential curves for the molecular hydrogen ion`}),`
`,(0,n.jsx)(s.h2,{children:`Linear combination of atomic orbitals`}),`
`,(0,n.jsxs)(s.p,{children:[`The analytical solutions are rather bulky and not particularly
instructive. One powerful idea, and very good approximation, is to
decompose the molecule wavefunction over the atomic orbitals of its
components. Going back to Fig. `,(0,n.jsx)(s.a,{href:`#fig-hydrogen-ion`,children:`1`}),` we could make the simple Ansatz:
`,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`\\psi_e(\\mathbf{r})= c_1 \\psi_{1s}(\\mathbf{r}_\\mathrm{A})+c_2 \\psi_{1s}(\\mathbf{r}_\\mathrm{B})`})]}),`
`,(0,n.jsx)(s.p,{children:`Note, that we made a very simple Ansatz at this stage and we could
decompose the system over a much larger set of excited states. But for
pedagogical reason we will stick to the simple model at this stage.
Going through the symmetry requirements, we find that we can write the
full wavefunction as:`}),`
`,(0,n.jsx)(s.pre,{children:(0,n.jsx)(s.code,{className:`language-math math-display`,children:`\\psi_{g,u}(\\mathbf{r})= \\frac{1}{\\sqrt{2\\pm2S}}\\left(\\psi_{1s}(\\mathbf{r}_\\mathrm{A})\\pm \\psi_{1s}(\\mathbf{r}_\\mathrm{B})\\right)`})}),`
`,(0,n.jsxs)(s.p,{children:[`The contribution `,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`S`}),` describes the overlap of the two atomic orbitals
`,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`S =  \\int d\\mathbf{r}\\psi_{1s}^*(\\mathbf{r}_\\mathrm{A})\\psi_{1s}(\\mathbf{r}_\\mathrm{B})`}),`
We can then evaluate the energy of the two states through the
variational principle:`]}),`
`,(0,n.jsx)(s.pre,{children:(0,n.jsx)(s.code,{className:`language-math math-display`,children:`E_{g,u} = \\left\\langle\\psi_{g,u}\\right|\\hat{H}_e\\left|\\psi_{g,u}\\right\\rangle\\\\
 = \\frac{1}{2\\pm2S}\\left(\\left\\langle\\psi_A\\right|\\pm \\left\\langle\\psi_B\\right|\\right)\\hat{H}_e\\left(\\left|\\psi_A\\right\\rangle\\pm \\left|\\psi_B\\right\\rangle\\right)\\\\
 = \\frac{E_{AA}\\pm E_{AB}}{1\\pm S}\\\\`})}),`
`,(0,n.jsxs)(s.p,{children:[`The resulting energy surfaces are shown in Fig. `,(0,n.jsx)(s.a,{href:`#fig-lcao`,children:`3`}),`. In the most
simplistic interpretation the gerade state does not have a node in the
middle and it is therefore of smaller kinetic energy.`]}),`
`,(0,n.jsx)(t,{id:`fig-lcao`,href:a,caption:`The energy surface of the LCAO for the hydrogen molecule ion`}),`
`,(0,n.jsx)(s.h1,{children:`The neutral hydrogen molecule`}),`
`,(0,n.jsx)(s.p,{children:`In the previous section we have seen how we can treat the coupling of
the nuclei through the exchange of a single shared electron. However, we
should now move on to the case of two neutral particles binding
together. What is here the relevant mechanism ?`}),`
`,(0,n.jsx)(t,{id:`fig-hydrogen`,href:o,caption:`The hydrogen molecule`}),`
`,(0,n.jsx)(s.p,{children:`In the following we will only consider the electronic part, which adds
up too:`}),`
`,(0,n.jsx)(s.p,{children:(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`\\hat{H} = -\\frac{1}{2}\\left(\\nabla_{\\mathbf{r}_1}^2+\\nabla_{\\mathbf{r}_2}^2\\right)-\\frac{1}{r_{A1}}-\\frac{1}{r_{A2}}-\\frac{1}{r_{B1}}-\\frac{1}{r_{B2}}+\\frac{1}{r_{12}}+\\frac{1}{R}`})}),`
`,(0,n.jsx)(s.p,{children:`We can now rewrite this Hamiltonian in the more instructive form`}),`
`,(0,n.jsx)(s.pre,{children:(0,n.jsx)(s.code,{className:`language-math math-display`,children:`
\\hat{H} = H_{0,1}+H_{0,2}+\\frac{1}{r_{12}}+\\frac{1}{R}\\\\
H_{0,i} = -\\frac{1}{2}\\nabla_{\\mathbf{r}_i}^2-\\frac{1}{r_{A,i}}-\\frac{1}{r_{B,i}}

`})}),`
`,(0,n.jsx)(s.p,{children:`We have can now use the results of the hydrogen ion to understand this
system.`}),`
`,(0,n.jsxs)(s.ul,{children:[`
`,(0,n.jsx)(s.li,{children:`We have for each electron the solution of hydrogen molecule ion.`}),`
`,(0,n.jsxs)(s.li,{children:[`In the next step, we have to put the two electrons properly within
this orbit with `,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`S=0`}),` and `,(0,n.jsx)(s.em,{children:`ignoring`}),` the `,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`e^-`}),` - `,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`e^-`}),` interaction.`]}),`
`]}),`
`,(0,n.jsx)(s.p,{children:`So we can make the Ansatz:`}),`
`,(0,n.jsx)(s.pre,{children:(0,n.jsx)(s.code,{className:`language-math math-display`,children:`\\psi(\\mathbf{r}_1, \\mathbf{r}_2) = \\psi_{g}(\\mathbf{r}_1)\\cdot\\psi_{g}(\\mathbf{r}_2)\\\\
= \\frac{1}{2 + 2S}\\left(\\psi_{1s}(\\mathbf{r}_{A1})+\\psi_{1s}(\\mathbf{r}_{B1})\\right)\\left(\\psi_{1s}(\\mathbf{r}_{A2})+\\psi_{1s}(\\mathbf{r}_{B2})\\right)\\\\
= \\frac{1}{2 + 2S}\\left(\\psi_{1s}(\\mathbf{r}_{A1})\\psi_{1s}(\\mathbf{r}_{B2})+\\psi_{1s}(\\mathbf{r}_{B1})\\psi_{1s}(\\mathbf{r}_{A2}) +\\psi_{1s}(\\mathbf{r}_{A1})\\psi_{1s}(\\mathbf{r}_{A2})+\\psi_{1s}(\\mathbf{r}_{B1})\\psi_{1s}(\\mathbf{r}_{B2}) \\right)`})}),`
`,(0,n.jsxs)(s.p,{children:[`The first two terms describe `,(0,n.jsx)(s.strong,{children:`kovalent binding`}),`. They
describe situations where each electron is associated with one core. The
last two terms describe `,(0,n.jsx)(s.strong,{children:`ionic binding`}),` as one associated both
electrons with a single atom and then looks one the attraction of
another ionic core. This is quite similiar to the interaction in the
`,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`H_2^+`}),` molecule.`]}),`
`,(0,n.jsxs)(s.p,{children:[`Within this approach, one actually finds a binding energy of
`,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`E_b = {-2.64}\\text{eV}`}),` at an equilibrium distance of `,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`R_e = 1.4 a_0`}),`.
The experimentally measured values differs quite substantially as we
have `,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`E_b = {-4.7}\\text{eV}`}),`. A substantial approximation was here that we
neglected the interaction between the electrons, which should repel.`]}),`
`,(0,n.jsx)(s.h2,{children:`The Heitler-London method`}),`
`,(0,n.jsx)(s.p,{children:`As the two electrons should repel each other, we can assume that the
ionic binding is strongly suppressed. So the wavefunction is now assumed
to be:`}),`
`,(0,n.jsx)(s.pre,{children:(0,n.jsx)(s.code,{className:`language-math math-display`,children:`
\\psi_{HL} = \\frac{1}{\\sqrt{2 + 2S^2}}\\left(\\psi_{1s}(\\mathbf{r}_{A1})\\psi_{1s}(\\mathbf{r}_{B2})+\\psi_{1s}(\\mathbf{r}_{B1})\\psi_{1s}(\\mathbf{r}_{A2})\\right)`})}),`
`,(0,n.jsxs)(s.p,{children:[`Again, the wavefunction cannot be factorized and the two
electrons are entangled because of the interactions. Recognize the
common theme with the Helium atom. Calculation of the binding energy
within this approximation leads to `,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`E_b = {-3.14}\\text{eV}`}),` and
`,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`R_e=1.6a_0`}),`.`]}),`
`,(0,n.jsx)(s.p,{children:`In the next lecture we will discuss how we can move on
from these extremely simple diatomic molecules to the assembly of richer
systems.`})]})}function l(e={}){let{wrapper:t}=e.components||{};return t?(0,n.jsx)(t,{...e,children:(0,n.jsx)(c,{...e})}):c(e)}export{l as default,s as frontmatter};