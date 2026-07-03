import{On as e}from"./chunk-DpnvOa7p.js";import{t}from"./chunk-CZAWoKTR2.js";var n=e(),r=`/assets/static/lecture17_pic1.zm6pKFs6.png`,i=`/assets/static/lecture17_pic2.Cy_zFZA5.png`,a=`/assets/static/lecture17_pic3.6mRwjOj7.png`,o=`/assets/static/lecture17_pic4.C-uzrx4a.png`,s=`/assets/static/lecture17_pic5.YARo3gf0.png`,c={author:[`fretchen`,`Selim Jochim`,`Matthias Weidemüller`],order:17,title:`Lecture 17 - Rotation and Vibration of Molecules`};function l(e){let c={a:`a`,code:`code`,del:`del`,h1:`h1`,h2:`h2`,li:`li`,ol:`ol`,p:`p`,pre:`pre`,strong:`strong`,ul:`ul`,...e.components};return(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)(c.p,{children:`We will study the existance of vibrational and rotational levels in
molecules. It allows us investigate the transitions of molecules and
introduce the Franck-Condon principle. Finally, we will study how such
intruiging molecules are used for the study of the permanent electric
dipole moment of the electron.`}),`
`,(0,n.jsx)(c.p,{children:`We studied during the last two lectures the properties the electronic
structure. For atoms the next step was the analysis of the transition
rules to understand the spectrum. However, for molecules the electronic
transition directly couple to the vibrational and rotational motion of
the nuclei, which will have to study first.`}),`
`,(0,n.jsx)(c.h1,{children:`A short reminder on nuclear motion`}),`
`,(0,n.jsxs)(c.p,{children:[`We discussed diatomic molecules, with `,(0,n.jsx)(c.code,{className:`language-math math-inline`,children:`N`}),` electrons bound to the nuclei. The full Hamiltonian of the molecule could be written in
the following fashion:
`,(0,n.jsx)(c.code,{className:`language-math math-inline`,children:`\\hat{H} = \\hat{T}_e + \\hat{T}_N + V(\\hat{\\mathbf{R}_\\mathrm{A}}, \\hat{\\mathbf{R}_\\mathrm{B}},\\hat{\\mathbf{r}}_1,\\cdots, \\hat{\\mathbf{r}}_N)`}),`
`,(0,n.jsx)(c.code,{className:`language-math math-inline`,children:`\\hat{T}_e`}),` describes the kinetic energy of the electrons, `,(0,n.jsx)(c.code,{className:`language-math math-inline`,children:`\\hat{T}_N`}),`
the kinetic energy of the nuclei and `,(0,n.jsx)(c.code,{className:`language-math math-inline`,children:`V`}),` the coupling between them. The
we decomposed the full wavefunction over a nuclear part and an
electronic part:
`,(0,n.jsx)(c.code,{className:`language-math math-inline`,children:`\\Psi(\\mathbf{R}_\\mathrm{A}, \\mathbf{R}_\\mathrm{B}, \\mathbf{r}_1,\\cdots, \\mathbf{r}_N) = \\psi_e(\\mathbf{R}_\\mathrm{A}, \\mathbf{R}_\\mathrm{B}, \\mathbf{r}_1,\\cdots, \\mathbf{r}_N)\\cdot \\psi_n(\\mathbf{R}_\\mathrm{A}, \\mathbf{R}_\\mathrm{B})`}),`
This allowed us to decouple nicely the two motions and study the
properties of the electronic potentials first. In the Born-Oppenheimer
approximation we obtained:`]}),`
`,(0,n.jsx)(c.pre,{children:(0,n.jsx)(c.code,{className:`language-math math-display`,children:`\\hat{T}_N \\psi_N + E_e (\\vec{R}_\\textrm{a}, \\vec{R}_\\textrm{b}) \\psi_N = E \\psi_N`})}),`
`,(0,n.jsx)(c.p,{children:`with`}),`
`,(0,n.jsx)(c.pre,{children:(0,n.jsx)(c.code,{className:`language-math math-display`,children:`\\hat{T}_N = - \\frac{1}{2 M_\\textrm{a}} \\Delta_{\\vec{R}_\\textrm{a}} - \\frac{1}{2 M_\\textrm{b}} \\Delta_{\\vec{R}_\\textrm{b}},`})}),`
`,(0,n.jsxs)(c.p,{children:[`the total energy `,(0,n.jsx)(c.code,{className:`language-math math-inline`,children:`E`}),` and the masses of the individual
atoms `,(0,n.jsx)(c.code,{className:`language-math math-inline`,children:`M_\\textrm{a}`}),` and `,(0,n.jsx)(c.code,{className:`language-math math-inline`,children:`M_\\textrm{b}`}),`. For the electronic energy
`,(0,n.jsx)(c.code,{className:`language-math math-inline`,children:`E_e`}),`, only `,(0,n.jsx)(c.code,{className:`language-math math-inline`,children:`\\vec{R} = \\vec{R}_\\textrm{a} - \\vec{R}_\\textrm{b}`}),` matters.
We then calculated the molecular potential curves `,(0,n.jsx)(c.code,{className:`language-math math-inline`,children:`E_e(R)`}),`, which differ
for each electronic configuration, discussed in the last lecture and sketched once more in Fig.
`,(0,n.jsx)(c.a,{href:`#fig-potential`,children:`1`}),`.`]}),`
`,(0,n.jsx)(t,{id:`fig-potential`,href:r,caption:`The molecular potential curves obtained from the Born-Oppenheimer Approximation`}),`
`,(0,n.jsx)(c.p,{children:`In the center of mass frame we can tranform and get:`}),`
`,(0,n.jsx)(c.pre,{children:(0,n.jsx)(c.code,{className:`language-math math-display`,children:`\\left( - \\frac{1}{2M} \\Delta_{\\vec{R}} + E_e (\\vec{R}) \\right) \\psi_\\textrm{n} (\\vec{R}) = E \\psi_\\textrm{n} (\\vec{R}),`})}),`
`,(0,n.jsxs)(c.p,{children:[(0,n.jsx)(c.code,{className:`language-math math-inline`,children:`\\vec{R}`}),` is spherically symmetric, and`]}),`
`,(0,n.jsx)(c.pre,{children:(0,n.jsx)(c.code,{className:`language-math math-display`,children:`M = \\frac{M_\\textrm{a} \\cdot M_\\textrm{b}}{M_\\textrm{a} + M_\\textrm{b}}`})}),`
`,(0,n.jsx)(c.p,{children:`is the reduced mass. This means that we can separate the
angular and radial motion to obtain:`}),`
`,(0,n.jsx)(c.pre,{children:(0,n.jsx)(c.code,{className:`language-math math-display`,children:`\\psi_\\textrm{n} (R,\\theta,\\varphi) = \\frac{1}{R} S(R) \\cdot Y_l^m (\\theta,\\varphi)`})}),`
`,(0,n.jsx)(c.p,{children:`They describe the rotational and vibrational levels of
the nucleus.`}),`
`,(0,n.jsx)(c.h1,{children:`Rotations`}),`
`,(0,n.jsx)(c.p,{children:`If we assume a "rigid" molecule where the distance between the atoms is
fixed, the rotational energy is simply given by:`}),`
`,(0,n.jsx)(c.pre,{children:(0,n.jsx)(c.code,{className:`language-math math-display`,children:`E_\\text{rot} (R) = \\frac{J\\cdot (J+1)}{2M R^2}\\, (\\text{a.u.})`})}),`
`,(0,n.jsxs)(c.p,{children:[`where `,(0,n.jsx)(c.code,{className:`language-math math-inline`,children:`M`}),` is the reduced mass of the nuclei in atomic
units and `,(0,n.jsx)(c.code,{className:`language-math math-inline`,children:`J`}),` is the angular momentum quantum number. The factor `,(0,n.jsx)(c.code,{className:`language-math math-inline`,children:`MR^2`}),`
represents the moment of inertia. For more complex atoms the
relationship is not quite as simple and the rotational energy is
typically described by the moment of interia `,(0,n.jsx)(c.code,{className:`language-math math-inline`,children:`I_{ij}`}),`. The Hamiltonian
for this rotation reads then:`]}),`
`,(0,n.jsx)(c.pre,{children:(0,n.jsx)(c.code,{className:`language-math math-display`,children:`\\hat{H}_{rot} =\\frac{J_x^2}{2I_{xx}}+\\frac{J_y^2}{2I_{yy}}+\\frac{J_z^2}{2I_{zz}}`})}),`
`,(0,n.jsxs)(c.p,{children:[`The molecule `,(0,n.jsx)(c.code,{className:`language-math math-inline`,children:`H_2`}),` has then a rotational frequency
`,(0,n.jsx)(c.code,{className:`language-math math-inline`,children:`\\omega/2\\pi =3\\cdot 10^{12}\\cdot J(J+1) \\text{Hz}`}),`.`]}),`
`,(0,n.jsx)(c.h1,{children:`Vibrations`}),`
`,(0,n.jsx)(c.p,{children:`As already known from the hydrogen atom we can use the angular solutions
to discuss the radial solutions. We have to solve now:`}),`
`,(0,n.jsx)(c.pre,{children:(0,n.jsx)(c.code,{className:`language-math math-display`,children:`\\left( \\frac{1}{2M} \\frac{d^2}{dR^2} + E_e (R) + \\frac{1}{2M} \\frac{J(J+1)}{R^2} \\right) S(r) = E_\\text{vib} S(R)`})}),`
`,(0,n.jsxs)(c.p,{children:[`If the extension from the minimum (see `,(0,n.jsx)(c.a,{href:`#fig-internuclear`,children:`2`}),`) is small, we can approximate it by a harmonic
potential. We can then find a vibrational energy
`,(0,n.jsx)(c.code,{className:`language-math math-inline`,children:`E_\\text{vib} = \\omega_0 (\\nu+\\frac{1}{2})\\, \\nu=0,1,\\cdots`}),` The
harmonic expansion around the minimum reads:`]}),`
`,(0,n.jsx)(c.pre,{children:(0,n.jsx)(c.code,{className:`language-math math-display`,children:`E_e \\approx E_0 + \\frac{1}{2} M \\omega_0^2 (R-R_0 )^2`})}),`
`,(0,n.jsxs)(c.p,{children:[`For the example of H`,(0,n.jsx)(c.del,{children:`2`}),`, we get `,(0,n.jsx)(c.code,{className:`language-math math-inline`,children:`\\omega/2\\pi \\sim 10^{14}`}),` Hz.`]}),`
`,(0,n.jsx)(t,{id:`fig-internuclear`,href:i,caption:`Internuclear potential with vibrational levels`}),`
`,(0,n.jsxs)(c.p,{children:[`A better approximation of the vibrational level structure than the
simple harmonic oscillator is the `,(0,n.jsx)(c.strong,{children:`Morse potential`}),`.`]}),`
`,(0,n.jsx)(c.h2,{children:`The Morse potential`}),`
`,(0,n.jsx)(c.p,{children:`In this case we approximate the molecular potential curves by:`}),`
`,(0,n.jsx)(c.pre,{children:(0,n.jsx)(c.code,{className:`language-math math-display`,children:`E_e(R) \\approx V_\\text{morse}(R)\\\\
V_\\text{morse}(R) =hcD_e(1-e^{-ax})^2\\text{ with }a =\\sqrt{\\frac{k}{2hcD_e}}\\\\
x = R-R_0`})}),`
`,(0,n.jsx)(c.p,{children:`Its particular usefulness stems from the fact that it is
still analyitically solvable and we obtain:`}),`
`,(0,n.jsx)(c.pre,{children:(0,n.jsx)(c.code,{className:`language-math math-display`,children:`E_{vib}=(\\nu+\\frac{1}{2})\\hbar \\omega-(\\nu+\\frac{1}{2})^2 \\hbar \\omega x_e\\\\
\\omega x_e = \\frac{a^2\\hbar}{2M}`})}),`
`,(0,n.jsxs)(c.p,{children:[(0,n.jsx)(c.code,{className:`language-math math-inline`,children:`x_e`}),` is then called the anharmonicity parameter.`]}),`
`,(0,n.jsx)(c.h1,{children:`Molecular transitions`}),`
`,(0,n.jsx)(c.p,{children:`We are now ready to discuss the different transitions that might appear
in the spectrum. And we will work our way through the different levels
of energy as we will see that they are all coupled.`}),`
`,(0,n.jsx)(c.h2,{children:`Rotational transitions`}),`
`,(0,n.jsxs)(c.p,{children:[`We will start out with the transitions of the lowest frequency, the
rotational transitions. So, we would like to know if it is possible to
transition from a state
`,(0,n.jsx)(c.code,{className:`language-math math-inline`,children:`\\left|\\epsilon, J, M_J\\right\\rangle`}),` to another state
`,(0,n.jsx)(c.code,{className:`language-math math-inline`,children:`\\left|\\epsilon, J', M_J'\\right\\rangle`}),`, where `,(0,n.jsx)(c.code,{className:`language-math math-inline`,children:`\\epsilon`}),`
describes the electronic and vibrational degree of freedom. This means
that we have to calculate as usual the the electric dipole moment:`]}),`
`,(0,n.jsx)(c.pre,{children:(0,n.jsx)(c.code,{className:`language-math math-display`,children:`\\left\\langle\\epsilon, J', M_J'\\right| \\vec{D}\\left|\\epsilon, J, M_J\\right\\rangle`})}),`
`,(0,n.jsx)(c.p,{children:`Within the Born-Oppenheimer approximation electronic and
rotational degree of freedom decouple and we can write:`}),`
`,(0,n.jsx)(c.pre,{children:(0,n.jsx)(c.code,{className:`language-math math-display`,children:`\\left\\langle\\epsilon, J', M_J'\\right| \\vec{D}\\left|\\epsilon, J, M_J\\right\\rangle = \\left\\langle J', M_J'\\right| \\left\\langle\\epsilon\\right|\\vec{D}\\left|\\epsilon\\right\\rangle\\left| J, M_J\\right\\rangle`})}),`
`,(0,n.jsxs)(c.p,{children:[`This electric dipole transitions were forbidden in atoms
as they do not have a permanent electric dipole moment. However,
hetero-nuclear atoms can have such a permanent electric dipole moment,
they are called polar molecules. Examples are alkali-alkali molecules
like NaK, NaCs, KRb whose permenanent electric dipole moment can be up
`,(0,n.jsx)(c.code,{className:`language-math math-inline`,children:`3 ea_0`}),`. It follows that:`]}),`
`,(0,n.jsxs)(c.ul,{children:[`
`,(0,n.jsx)(c.li,{children:(0,n.jsx)(c.strong,{children:`Pure rotational transitions exist in polar molecules.`})}),`
`]}),`
`,(0,n.jsxs)(c.p,{children:[`The transition rules are di-atomic molecules: `,(0,n.jsx)(c.code,{className:`language-math math-inline`,children:`\\Delta J = \\pm 1`}),` and
`,(0,n.jsx)(c.code,{className:`language-math math-inline`,children:`\\Delta M_J= 0, \\pm1`}),`. For more complex molecules these transition rules
can vary quite substantially as the rotational degree of freedom might
have to be described by an additional quantum number.`]}),`
`,(0,n.jsx)(c.h2,{children:`Vibrational transitions`}),`
`,(0,n.jsx)(c.p,{children:`In the next step, we would like to understand the transitions between
different vibrational levels. Hence, we are investigating the electric
dipole moment`}),`
`,(0,n.jsx)(c.pre,{children:(0,n.jsx)(c.code,{className:`language-math math-display`,children:`\\left\\langle\\epsilon, \\nu'\\right| \\vec{D}\\left|\\epsilon, \\nu\\right\\rangle= \\left\\langle\\nu'\\right| \\vec{D}_\\epsilon\\left|\\nu\\right\\rangle`})}),`
`,(0,n.jsxs)(c.p,{children:[`The evaluation is now not quite as simple as for the
rotational degree of freedom as both `,(0,n.jsx)(c.code,{className:`language-math math-inline`,children:`\\nu`}),` and `,(0,n.jsx)(c.code,{className:`language-math math-inline`,children:`\\epsilon`}),` will influence
the length of the molecule, they both directly depend on `,(0,n.jsx)(c.code,{className:`language-math math-inline`,children:`R`}),`. We can
develop the electric dipole moment as a function of distance from the
equilibrium and write then:`]}),`
`,(0,n.jsx)(c.pre,{children:(0,n.jsx)(c.code,{className:`language-math math-display`,children:`\\left\\langle\\nu'\\right| \\vec{D}_\\epsilon\\left|\\nu\\right\\rangle= \\left\\langle\\nu'\\right| \\left(\\vec{D}_\\epsilon(0)+ \\frac{d\\vec{D}_\\epsilon}{dx}x+\\cdots\\right)\\left|\\nu\\right\\rangle\\\\
= \\frac{d\\vec{D}_\\epsilon}{dx}\\left\\langle\\nu'\\right|x\\left|\\nu\\right\\rangle+\\cdots`})}),`
`,(0,n.jsx)(c.p,{children:`So vibrational transistions will only happen in
molecules for which the permanent electric dipole changes as a function
of distance. Once again they are non-existant in homo-nuclear molecules.`}),`
`,(0,n.jsx)(c.h1,{children:`Vibronic transitions`}),`
`,(0,n.jsxs)(c.p,{children:[`At this stage, we are ready to discuss electronic transitions. If we are
performing an electronic transition this also implies a change on the
molecular potential curve as indicated in Fig.
`,(0,n.jsx)(c.a,{href:`#fig-franck-condon`,children:`3`}),`. Imagine now the
transition of the ground state molecular branch (called the X branch) to
a higher electronic shell (called A, B, C, ...). Such a transition will
happen at constant internuclear radius as they are much faster than the
nuclei motion. This implies that an electronic transition will typically
excite the molecule into a high vibrational branch. The dipole moment is
then proportional too:`]}),`
`,(0,n.jsx)(c.pre,{children:(0,n.jsx)(c.code,{className:`language-math math-display`,children:`\\left\\langle\\epsilon', \\nu'\\right| \\vec{D}\\left|\\epsilon, \\nu\\right\\rangle\\approx \\vec{D}_{\\epsilon, \\epsilon'} \\left\\langle\\nu'\\right| \\left|\\nu\\right\\rangle`})}),`
`,(0,n.jsx)(t,{id:`fig-franck-condon`,href:a,caption:`The Franck-Condon principle for a simple toy model`}),`
`,(0,n.jsxs)(c.p,{children:[`The factor
`,(0,n.jsx)(c.code,{className:`language-math math-inline`,children:`S(\\nu, \\nu')=|\\left\\langle\\nu\\right|\\left|\\nu'\\right\\rangle|^2`}),`
is then called the Franck-Condon factor and it describes the strength of
the transitions.`]}),`
`,(0,n.jsx)(c.p,{children:`It is exactly this coupling of different hierarchies that makes the
molecular spectra so rich and also extremely tough to control.`}),`
`,(0,n.jsx)(c.h1,{children:`Can we get into the groundstate ?`}),`
`,(0,n.jsxs)(c.p,{children:[`Given all the complexities of molecules it seems non-trivial to find a
scheme that gets them into the ground state. For atoms laser cooling has
proven very efficient as we will discuss later. However, it mainly
adresses the cooling of external degrees of freedom. In molecules a
significant amount of energy its in the rotational and vibrational
levels. In this connection, a beautiful solution has been demonstrated
in `,(0,n.jsx)(c.a,{href:`http://dx.doi.org/10.1126/science.1163861`,children:`Ni 2008`}),`.`]}),`
`,(0,n.jsxs)(c.p,{children:[`The scheme is visualized in Fig. `,(0,n.jsx)(c.a,{href:`#fig-ni2008`,children:`4`}),`.`]}),`
`,(0,n.jsx)(t,{id:`fig-ni2008`,href:o,caption:`Production of groundstate molecules of K + Rb`}),`
`,(0,n.jsxs)(c.p,{children:[`In a first step the atoms are cooled and then associated to a highly
excited molecule in the a^3^`,(0,n.jsx)(c.code,{className:`language-math math-inline`,children:`\\Sigma`}),` state. From there the atom has to
be transferred down in to the ground state
`,(0,n.jsx)(c.code,{className:`language-math math-inline`,children:`\\left|g\\right\\rangle`}),`. A direct thransfer is not possible
as the Franck-Condon factors do not allow for it. Another path is to go
through an intermediate level (here the 2`,(0,n.jsx)(c.code,{className:`language-math math-inline`,children:`^3 \\Sigma`}),` level), which has
overlap with both of them. However, this level has typically overlap
with plenty of other levels and a finite lifetime. How can we then
optimize the transfer ? The idea is to use the concept of dark states in
the triplet of `,(0,n.jsx)(c.code,{className:`language-math math-inline`,children:`\\{i, e, g\\}`}),`.`]}),`
`,(0,n.jsx)(c.h2,{children:`The dark states in three level systems`}),`
`,(0,n.jsx)(c.p,{children:`We can visualize the idea of the dark state transfer through the
following Hamiltonian:`}),`
`,(0,n.jsx)(c.pre,{children:(0,n.jsx)(c.code,{className:`language-math math-display`,children:`\\hat{H}= \\Omega_1\\left(\\left|i\\right\\rangle\\left\\langle e\\right|+\\left|e\\right\\rangle\\left\\langle i\\right|\\right)+\\Omega_2\\left(\\left|g\\right\\rangle\\left\\langle e\\right|+\\left|e\\right\\rangle\\left\\langle g\\right|\\right)`})}),`
`,(0,n.jsx)(c.p,{children:`We can rewrite it as:`}),`
`,(0,n.jsx)(c.pre,{children:(0,n.jsx)(c.code,{className:`language-math math-display`,children:`\\hat{H}= (\\Omega_1\\left|i\\right\\rangle+\\Omega_2\\left|g\\right\\rangle)\\left\\langle e\\right|+\\left|e\\right\\rangle(\\Omega_1\\left\\langle i\\right|+\\Omega_2\\left\\langle g\\right|)\\\\
\\propto\\left|B\\right\\rangle\\left\\langle e\\right|+\\left|e\\right\\rangle\\left\\langle B\\right|\\\\
\\left|B\\right\\rangle= \\frac{\\Omega_1\\left|i\\right\\rangle+\\Omega_2\\left|g\\right\\rangle}{\\sqrt{\\Omega_1^2+\\Omega_2^2}}`})}),`
`,(0,n.jsxs)(c.p,{children:[`So in the three level scheme the excited state is always
could to the so-called bright state, which is a coherent superposition
of `,(0,n.jsx)(c.code,{className:`language-math math-inline`,children:`\\left|g\\right\\rangle`}),` and
`,(0,n.jsx)(c.code,{className:`language-math math-inline`,children:`\\left|i\\right\\rangle`}),`. The orthogonal state is the dark
state:`]}),`
`,(0,n.jsx)(c.pre,{children:(0,n.jsx)(c.code,{className:`language-math math-display`,children:`\\left|D\\right\\rangle= \\frac{\\Omega_1\\left|g\\right\\rangle-\\Omega_2\\left|i\\right\\rangle}{\\sqrt{\\Omega_1^2+\\Omega_2^2}}\\\\
\\langle B| D\\rangle = 0`})}),`
`,(0,n.jsx)(c.p,{children:`Now we can also discuss the transfer sequence non as
STIRAP (stimulated Raman adiabatic passage).`}),`
`,(0,n.jsx)(c.h2,{children:`STIRAP`}),`
`,(0,n.jsx)(c.p,{children:`STIRAP transfers the loosely bound molecules coherently into the
groundstate without ever passing through the lossy excited level. It has
the following steps:`}),`
`,(0,n.jsxs)(c.ol,{children:[`
`,(0,n.jsxs)(c.li,{children:[`
`,(0,n.jsxs)(c.p,{children:[`The dressing laser `,(0,n.jsx)(c.code,{className:`language-math math-inline`,children:`\\Omega_2`}),` is ramped on. The initial
`,(0,n.jsx)(c.code,{className:`language-math math-inline`,children:`\\left|i\\right\\rangle`}),` is now the dark state.`]}),`
`]}),`
`,(0,n.jsxs)(c.li,{children:[`
`,(0,n.jsxs)(c.p,{children:[`The coupling laser `,(0,n.jsx)(c.code,{className:`language-math math-inline`,children:`\\Omega_1`}),` is ramped on, while the laser
`,(0,n.jsx)(c.code,{className:`language-math math-inline`,children:`\\Omega_2`}),` is ramped down. This transfers the
`,(0,n.jsx)(c.code,{className:`language-math math-inline`,children:`\\left|i\\right\\rangle`}),` adiabatically into the state
`,(0,n.jsx)(c.code,{className:`language-math math-inline`,children:`\\left|g\\right\\rangle`}),`, which is the dark state for
fully switched of `,(0,n.jsx)(c.code,{className:`language-math math-inline`,children:`\\Omega_2`}),`.`]}),`
`]}),`
`]}),`
`,(0,n.jsxs)(c.p,{children:[`The molecules are now in the groundstate with a transfer efficiency of
roughly `,(0,n.jsx)(c.code,{className:`language-math math-inline`,children:`50\\%`}),`.`]}),`
`,(0,n.jsx)(c.h1,{children:`Measurement of the electron electric dipole moment`}),`
`,(0,n.jsxs)(c.p,{children:[`Despite their complexity, molecules can be an enormously powerful tool
for precision measurements as you might find in `,(0,n.jsx)(c.a,{href:`http://dx.doi.org/10.1103/revmodphys.90.025008`,children:`this`}),` or `,(0,n.jsx)(c.a,{href:`https://arxiv.org/abs/1710.02504`,children:`this review`}),`. The test of
the existance of a permanent electric dipole moment (electron edm) of
the electron is one of these tests.`]}),`
`,(0,n.jsxs)(c.p,{children:[`What does does the existance of electron edm actually mean ? We have
already discussed quite heavily the existance of a permanent edm for
polar molecules. The amplitude of their dipole moment is in the order of
a few `,(0,n.jsx)(c.code,{className:`language-math math-inline`,children:`ea_0`}),`, which is also the natural unit for the induced edm of
atoms. One could now also imagine that the electron itself has an edm,
which is aligned with its spin `,(0,n.jsx)(c.code,{className:`language-math math-inline`,children:`\\vec{D}_e = d_e \\vec{s}_e`}),`. The standard
model actually predicts such a permanent electron edm, but only of the
amplitude `,(0,n.jsx)(c.code,{className:`language-math math-inline`,children:`d_e \\approx 10^{-30}ea_0`}),`, which is fantastically small .
However, the search continues as most extensions of the standard model
actually predict substantially higher values as summarized in Fig.
`,(0,n.jsx)(c.a,{href:`#fig-dipole`,children:`5`}),`. As we can see the
most precise measurments are actually performed in very heavy di-atomic
molecules.`]}),`
`,(0,n.jsxs)(c.p,{children:[`In these molecules the electron 'feels' enormous effective electric
fields, which can reach the `,(0,n.jsx)(c.a,{href:`http://dx.doi.org/10.1103/physrevlett.119.153001`,children:`several GV/cm regime`}),`.`]}),`
`,(0,n.jsx)(t,{id:`fig-dipole`,href:s,caption:`Search for the permanent electric dipole moment`}),`
`,(0,n.jsx)(c.p,{children:`The search for the dipole moment is then testing the dependence of the
electron energy:`}),`
`,(0,n.jsx)(c.pre,{children:(0,n.jsx)(c.code,{className:`language-math math-display`,children:`E_\\pm  = \\pm(\\mu B_0 + d_e E)`})}),`
`,(0,n.jsxs)(c.p,{children:[`This energy difference can be read out through Ramsey
spectroscopy. Switching the electric field allows then to switch the
frequency difference by `,(0,n.jsx)(c.code,{className:`language-math math-inline`,children:`\\hbar \\delta \\omega = 4d_e E`}),`. Only an upper
limit is known up to now `,(0,n.jsx)(c.code,{className:`language-math math-inline`,children:`|d_e|< 8.7 e cm`}),`.`]})]})}function u(e={}){let{wrapper:t}=e.components||{};return t?(0,n.jsx)(t,{...e,children:(0,n.jsx)(l,{...e})}):l(e)}export{u as default,c as frontmatter};