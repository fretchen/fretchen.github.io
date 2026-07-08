import{Cn as e}from"./chunk-Bzf2rILe.js";import{t}from"./chunk-oyhCWECb2.js";var n=e(),r=`/assets/static/lecture13_pic1.DoiP_ijC.png`,i=`/assets/static/lecture13_pic2.UWhdBRNo.png`,a=`/assets/static/lecture13_pic3.BFua-xd5.png`,o=`/assets/static/lecture13_pic4.CeXzndSu.png`,s=`/assets/static/lecture13_pic5.mOjb_wfM.png`,c=`/assets/static/lecture13_pic6.D2ikgDNf.png`,l={author:[`fretchen`,`Selim Jochim`,`Matthias Weidemüller`],order:13,title:`Lecture 13 - Atoms with many electrons`};function u(e){let l={a:`a`,code:`code`,em:`em`,h1:`h1`,h2:`h2`,h4:`h4`,li:`li`,p:`p`,pre:`pre`,ul:`ul`,...e.components};return(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)(l.p,{children:`After our discussion of extremely simple atoms like hydrogen and helium,
we will now discuss the most important properties of more complex atoms.
We will see, how we can categorize them and discuss some of the general
properties`}),`
`,(0,n.jsx)(l.p,{children:`We started the discussion of atoms in lecture 3 by an extremely simple
and powerful model, the two-level system . We then moved
on to discuss how it can emerge within the hydrogen atom and the Helium
atom. For both of these we dived again into simplified schemes.
Especially for Hydrogen, we saw in lecture 7 the exploding complexity of
the models as we tried to describe it. If we now want
to leave these rather academic problems and turn to the other widely
used atoms, molecules etc, we have towards effective models for two
reasons:`}),`
`,(0,n.jsxs)(l.ul,{children:[`
`,(0,n.jsxs)(l.li,{children:[`
`,(0,n.jsx)(l.p,{children:`Analytical solutions do not exist.`}),`
`]}),`
`,(0,n.jsxs)(l.li,{children:[`
`,(0,n.jsx)(l.p,{children:`Full numerical solutions become extremely and expansive.`}),`
`]}),`
`]}),`
`,(0,n.jsxs)(l.p,{children:[`A particularly instructive discussion of the ineffeciency of brute force
numerical methods was given by Kenneth Wilson, the father of the
renormalization group, in Sec 3 of `,(0,n.jsx)(l.a,{href:`http://dx.doi.org/10.1016/0001-8708(75)90149-8`,children:`Wilson 1975`}),`.`]}),`
`,(0,n.jsx)(t,{id:`fig-toy`,href:r,caption:`A toy model, exemplifying the problem of direct numerical analysis`}),`
`,(0,n.jsxs)(l.p,{children:[`The main idea is plotted in Fig. `,(0,n.jsx)(l.a,{href:`#fig-toy`,children:`1`}),` and its description in the words of Kenny Wilson can
be found in Fig. `,(0,n.jsx)(l.a,{href:`#fig-ineff`,children:`2`}),`.`]}),`
`,(0,n.jsx)(t,{id:`fig-ineff`,href:i,caption:`On the inefficiency of brute force numerics`}),`
`,(0,n.jsx)(l.p,{children:`We will come back to different experimental approaches to solve problems
for which we cannot devise effective theories at a later stage, when we
discuss quantum simulation and quantum computation with atomic systems.
But first we will try to gain a good understanding of atoms with many
electrons.`}),`
`,(0,n.jsx)(l.h1,{children:`Atoms with Many Electrons`}),`
`,(0,n.jsx)(l.p,{children:`As already discussed before, the N electron system cannot be solved in
its full complexity, so we have to walk through the different levels of
physical effects to understand what is going on. We will start out with
the simplest model, which consists of`}),`
`,(0,n.jsxs)(l.ul,{children:[`
`,(0,n.jsxs)(l.li,{children:[`
`,(0,n.jsx)(l.p,{children:`N electrons without spin`}),`
`]}),`
`,(0,n.jsxs)(l.li,{children:[`
`,(0,n.jsxs)(l.p,{children:[`Bound to the point-like nucleus of charge `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`Z`}),`, which is supposed to
be not moving.`]}),`
`]}),`
`]}),`
`,(0,n.jsx)(l.p,{children:`In natural units, the Hamiltonian can be written as:`}),`
`,(0,n.jsx)(l.pre,{children:(0,n.jsx)(l.code,{className:`language-math math-display`,children:`\\hat{H} = \\sum_i^N \\left(-\\frac{1}{2} \\vec{\\nabla}^2_{r_i} - \\frac{Z}{r_i} \\right) + \\sum_{i<j} \\frac{1}{r_{ij}}.`})}),`
`,(0,n.jsxs)(l.p,{children:[`The system is visualized in Fig.
`,(0,n.jsx)(l.a,{href:`#fig-three-ele`,children:`3`}),`.`]}),`
`,(0,n.jsx)(t,{id:`fig-three-ele`,href:a,caption:`Charge distribution of three electrons bound to the nucleus`}),`
`,(0,n.jsx)(l.p,{children:`As before the Hamiltonian has two contributions:`}),`
`,(0,n.jsxs)(l.ul,{children:[`
`,(0,n.jsxs)(l.li,{children:[`
`,(0,n.jsx)(l.p,{children:`The well understood binding of each electron to the nucleus, which
allows us to make the connection with the hydrogen orbitals.`}),`
`]}),`
`,(0,n.jsxs)(l.li,{children:[`
`,(0,n.jsx)(l.p,{children:`The interaction between the electrons, which couples all the
orbitals.`}),`
`]}),`
`]}),`
`,(0,n.jsxs)(l.p,{children:[`How can we deal with the `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`1/r_{ij}`}),` terms? If many electrons are
contained in the system we cannot ignore the influence of the
electron-electron interaction on the system, which was already a
questionable approximation in the Helium atom.`]}),`
`,(0,n.jsx)(l.h1,{children:`Central Field Approximation`}),`
`,(0,n.jsxs)(l.p,{children:[`But we can bring back the system to the well-known problems with
spherical symmetry by splitting the interaction into two parts. One will
be assumed to have spherical symmetry and will be written as
`,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`\\sum_i S(r_i)`}),` and the rest will be treated as a perturbation. So we
obtain the Hamiltonian:`]}),`
`,(0,n.jsx)(l.pre,{children:(0,n.jsx)(l.code,{className:`language-math math-display`,children:`\\hat{H} = \\hat{H}_s + \\hat{H}_1\\\\
\\hat{H}_s = \\sum_i^N \\left(-\\frac{1}{2} \\vec{\\nabla}^2_{r_i} + V_\\textrm{cf}(r_i) \\right)\\\\
V_\\textrm{cf} (r_i) = - \\frac{Z}{r_i} + S(r_i),`})}),`
`,(0,n.jsx)(l.p,{children:`The perturbation is then difference between the
spherically symmetric part of the interaction and the true
electron-electron interaction:`}),`
`,(0,n.jsx)(l.pre,{children:(0,n.jsx)(l.code,{className:`language-math math-display`,children:`\\hat{H}_1 = \\sum_{i<j} \\frac{1}{r_{ij}} - \\sum_i S(r_i)`})}),`
`,(0,n.jsxs)(l.p,{children:[(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`S(r_i)`}),` describes now the screening of the nucleus due
to the other electrons. This function interpolates between (see
`,(0,n.jsx)(l.a,{href:`#fig-screening`,children:`4`}),`):`]}),`
`,(0,n.jsx)(l.pre,{children:(0,n.jsx)(l.code,{className:`language-math math-display`,children:`V_\\textrm{cf} (\\vec{r}_i) = \\left\\{ \\begin{array}{ccc} -\\frac{Z}{r_i} &\\text{for}& r\\to 0 \\\\ \\\\ -\\frac{Z-N+1}{r_i} & \\text{for} & r\\to\\infty  \\end{array} \\right.`})}),`
`,(0,n.jsxs)(l.ul,{children:[`
`,(0,n.jsxs)(l.li,{children:[`
`,(0,n.jsx)(l.p,{children:`For very small distances the electron mainly sees the strong
attraction of the nucleus.`}),`
`]}),`
`,(0,n.jsxs)(l.li,{children:[`
`,(0,n.jsxs)(l.p,{children:[`For very large distances the other electrons mostly screen the
charge of the nucleus and electron feels the `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`1/r`}),` potential of the
hydrogen atom.`]}),`
`]}),`
`]}),`
`,(0,n.jsx)(t,{id:`fig-screening`,href:o,caption:`The screening as a function of distance`}),`
`,(0,n.jsxs)(l.p,{children:[`We can now focus on the study of the part with spherical symmetry
`,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`\\hat{H}_s`}),`. Given its symmetry, we can once again use the conservation
of orbital angular momentum (see Lecture 5). As a
result, the wave function can be a product state of single-particle wave
functions:`]}),`
`,(0,n.jsx)(l.pre,{children:(0,n.jsx)(l.code,{className:`language-math math-display`,children:`\\psi_\\textrm{cf} (\\vec{r}_1 , \\cdots , \\vec{r}_\\textrm{n} ) = \\psi_1 (\\vec{r}_1) \\cdot \\psi_2(\\vec{r}_2) \\cdot \\cdots \\psi_\\textrm{n}(\\vec{r}_\\textrm{n}),`})}),`
`,(0,n.jsxs)(l.p,{children:[`where `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`\\psi_i(\\vec{r}_i)`}),` are solutions of the
Schrödinger equation:`]}),`
`,(0,n.jsx)(l.pre,{children:(0,n.jsx)(l.code,{className:`language-math math-display`,children:`\\left( - \\frac{1}{2} \\vec{\\nabla}^2_{\\vec{r}_i} + V_\\textrm{cf} (r_i) \\right) \\psi_i (\\vec{r}_i) = E_i \\psi_i(\\vec{r}_i).`})}),`
`,(0,n.jsxs)(l.p,{children:[(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`\\psi_i`}),` can be split up into a radial and an angular
part:`]}),`
`,(0,n.jsx)(l.pre,{children:(0,n.jsx)(l.code,{className:`language-math math-display`,children:`\\psi_i = \\psi(nlm)_i = Y_{lm} (\\theta, \\varphi) \\cdot R_{nl} (r).`})}),`
`,(0,n.jsxs)(l.p,{children:[`For the radial part we get `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`u(r) = r\\cdot R(r)`}),`. Thus,
`,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`u(r)`}),` solves the radial Schrödinger equation:`]}),`
`,(0,n.jsx)(l.pre,{children:(0,n.jsx)(l.code,{className:`language-math math-display`,children:`\\left( - \\frac{1}{2} \\frac{d^2}{dr^2} + V_\\textrm{cf}(r) + \\frac{l(l+1)}{2r^2}\\right) u_{nl} = E_{nl} u_{nl} (r).`})}),`
`,(0,n.jsxs)(l.p,{children:[`The major difference to the `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`\\mathrm{H}`}),` atom is that
the degeneracy of the `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`l`}),` levels is lifted because of `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`V_\\textrm{cf}`}),`.`]}),`
`,(0,n.jsx)(l.h2,{children:`On the determination of the effective potential`}),`
`,(0,n.jsxs)(l.p,{children:[`We will not discuss here the different techniques to derive the central
field in detail as this is quickly diving into the different numerical
techniques of many-body systems. A first discussion of the different
approaches can be found in chapter 10 of `,(0,n.jsx)(l.a,{href:`http://dx.doi.org/10.1007/978-3-642-54322-7_10`,children:`Hertel 2015`}),`. The different
levels of sophistication are:`]}),`
`,(0,n.jsxs)(l.ul,{children:[`
`,(0,n.jsxs)(l.li,{children:[`
`,(0,n.jsxs)(l.p,{children:[`The `,(0,n.jsx)(l.em,{children:`Thomas-Fermi`}),` model, which assumes that the `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`N`}),` electrons
behave like a Fermi gas inside the `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`Z/r`}),` potential.`]}),`
`]}),`
`,(0,n.jsxs)(l.li,{children:[`
`,(0,n.jsx)(l.p,{children:`The Hartree method, in which the effective potential is iteratively
recalculated based on the obtained solutions to the radial
Schrödinger equation.`}),`
`]}),`
`,(0,n.jsxs)(l.li,{children:[`
`,(0,n.jsx)(l.p,{children:`The Hartree Fock method, in which we also take into account the
proper symmetrization of the wavefunctions.`}),`
`]}),`
`]}),`
`,(0,n.jsx)(l.h1,{children:`Filling up the shells`}),`
`,(0,n.jsx)(l.p,{children:`If we can ignore the spin for the determination of the energy levels, we
have the following quantum numbers:`}),`
`,(0,n.jsxs)(l.ul,{children:[`
`,(0,n.jsxs)(l.li,{children:[`
`,(0,n.jsxs)(l.p,{children:[(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`n`}),`, which is electron shell.`]}),`
`]}),`
`,(0,n.jsxs)(l.li,{children:[`
`,(0,n.jsxs)(l.p,{children:[(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`l`}),`, which is the orbital angular momentum with `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`l<n`}),`.`]}),`
`]}),`
`,(0,n.jsxs)(l.li,{children:[`
`,(0,n.jsxs)(l.p,{children:[(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`s`}),`, which is the spin of the electron and it can be `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`\\pm 1/2`})]}),`
`]}),`
`]}),`
`,(0,n.jsxs)(l.p,{children:[`As the electrons are fermions we can fill up each of the `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`nl`}),` states
with two of them. We then write down the configuration of the electron
by writing down the numbers of electrons per `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`nl`}),` configuration. So we
get the periodic table shown in Fig. `,(0,n.jsx)(l.a,{href:`#fig-measure`,children:`Periodic table`}),`. We will typically use the following notation:`]}),`
`,(0,n.jsxs)(l.ul,{children:[`
`,(0,n.jsxs)(l.li,{children:[`
`,(0,n.jsxs)(l.p,{children:[`A `,(0,n.jsx)(l.em,{children:`configuration`}),` is the distribution of the electrons over the
different orbits.`]}),`
`]}),`
`,(0,n.jsxs)(l.li,{children:[`
`,(0,n.jsxs)(l.p,{children:[`Electrons with the same `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`n`}),` are part of the same `,(0,n.jsx)(l.em,{children:`shell`}),`.`]}),`
`]}),`
`,(0,n.jsxs)(l.li,{children:[`
`,(0,n.jsxs)(l.p,{children:[`Electrons with the same `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`n`}),` and `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`l`}),` are part of the same
`,(0,n.jsx)(l.em,{children:`sub-shell`}),`.`]}),`
`]}),`
`,(0,n.jsxs)(l.li,{children:[`
`,(0,n.jsxs)(l.p,{children:[`The inner shells are typically filled and form the `,(0,n.jsx)(l.em,{children:`core`}),`.`]}),`
`]}),`
`,(0,n.jsxs)(l.li,{children:[`
`,(0,n.jsxs)(l.p,{children:[`The outermost shell is typically named the `,(0,n.jsx)(l.em,{children:`valence`}),` shell.`]}),`
`]}),`
`]}),`
`,(0,n.jsx)(t,{id:`fig-measure`,href:s,caption:`Periodic table`}),`
`,(0,n.jsx)(l.h1,{children:`Alkali Atoms`}),`
`,(0,n.jsx)(l.p,{children:`Alkali atoms are the simplest to understand and widely used in the field
of laser cooling. The electron configurations are`}),`
`,(0,n.jsx)(l.h4,{children:`Examples.`}),`
`,(0,n.jsxs)(l.ul,{children:[`
`,(0,n.jsxs)(l.li,{children:[`
`,(0,n.jsxs)(l.p,{children:[(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`\\mathrm{Li}`}),`: 1s`,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`^2`}),` 2s`]}),`
`]}),`
`,(0,n.jsxs)(l.li,{children:[`
`,(0,n.jsxs)(l.p,{children:[(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`\\mathrm{Na}`}),`:
1s`,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`^2`}),` 2s`,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`^2`}),` 2p`,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`^6`}),` 3s`]}),`
`]}),`
`,(0,n.jsxs)(l.li,{children:[`
`,(0,n.jsxs)(l.p,{children:[(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`\\mathrm{K}`}),`:
1s`,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`^2`}),` 2s`,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`^2`}),` 2p`,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`^6`}),` 3s`,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`^2`}),` 3p`,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`^6`}),` 4s,
so we fill up the 4s orbitals before the 3d orbitals.`]}),`
`]}),`
`,(0,n.jsxs)(l.li,{children:[`
`,(0,n.jsxs)(l.p,{children:[(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`\\mathrm{Rb}`}),`:
1s`,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`^2`}),` 2s`,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`^2`}),` 2p`,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`^6`}),` 3s`,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`^2`}),` 3p`,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`^6`}),` 3d`,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`^{10}`}),` 4s`,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`^2`}),` 4p`,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`^6`}),` 5s,
so we fill up the 5s orbitals before the 4d and 4f orbitals.`]}),`
`]}),`
`,(0,n.jsxs)(l.li,{children:[`
`,(0,n.jsxs)(l.p,{children:[(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`\\mathrm{Cs}`}),`:
1s`,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`^2`}),` 2s`,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`^2`}),` 2p`,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`^6`}),` 3s`,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`^2`}),` 3p`,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`^6`}),` 3d`,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`^{10}`}),` 4s`,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`^2`}),` 4p`,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`^6`}),` 4d`,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`^{10}`}),` 5s`,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`^{2}`}),` 5p`,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`^6`}),` 6s,
so we fill up the 6s orbitals before the 4f, 5d and 5f orbitals.`]}),`
`]}),`
`]}),`
`,(0,n.jsxs)(l.p,{children:[`This structure can be nicely understood by the idea of screening as
introduced in the central field approximation. Consider for example the
`,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`\\mathrm{Na}`}),` for which one electron has to be on the third shell.
Within the hydrogen atom the 3s, 3p and 3d are degenerate, however the
screening will lift this degeneracy.`]}),`
`,(0,n.jsxs)(l.ul,{children:[`
`,(0,n.jsxs)(l.li,{children:[`
`,(0,n.jsx)(l.p,{children:`Electrons in the s-shell spend a lot of time close to the nucleus
and fill a strong binding potential, i.e. they have a low energy.`}),`
`]}),`
`,(0,n.jsxs)(l.li,{children:[`
`,(0,n.jsx)(l.p,{children:`On the other extreme the electrons in the d-shell have large angular
momentum, which hinders them from getting close to the core. The 10
electrons can therefore efficiently screen the nucleus from the
electron. The energy of the d shell is therefore quite close to the
energy of the hydrogen atom.`}),`
`]}),`
`]}),`
`,(0,n.jsxs)(l.p,{children:[`For `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`\\mathrm{K}`}),` the same principle applies.`]}),`
`,(0,n.jsxs)(l.ul,{children:[`
`,(0,n.jsxs)(l.li,{children:[`
`,(0,n.jsx)(l.p,{children:`The 4s orbital is strongly shifted down to the strong nuclear
potential.`}),`
`]}),`
`,(0,n.jsxs)(l.li,{children:[`
`,(0,n.jsx)(l.p,{children:`The 3d orbital is well screened by the other electrons, such that it
is of higher energy than the 4s orbit.`}),`
`]}),`
`]}),`
`,(0,n.jsxs)(l.p,{children:[`We can describe this effect empirically through the `,(0,n.jsx)(l.em,{children:`quantum defect`}),`. We
simply write down the energy levels as:`]}),`
`,(0,n.jsx)(l.pre,{children:(0,n.jsx)(l.code,{className:`language-math math-display`,children:`E_{nl} \\cong -  R_{y,\\infty} \\cdot \\left( \\frac{1}{n-\\delta_l} \\right)^2,`})}),`
`,(0,n.jsxs)(l.p,{children:[`where `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`\\delta_l`}),` is the quantum defect for a certain
value of `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`l`}),`. Some examples are summarized in Fig.
`,(0,n.jsx)(l.a,{href:`#fig-quantum-defect`,children:`6`}),`.`]}),`
`,(0,n.jsx)(t,{id:`fig-quantum-defect`,href:c,caption:`The quantum defect for different alkali atoms`}),`
`,(0,n.jsx)(l.p,{children:`The effect of the quantum defect is actually so substantial that it
introduces optical transitions between the different subshells of Alkali
atoms.`}),`
`,(0,n.jsxs)(l.ul,{children:[`
`,(0,n.jsxs)(l.li,{children:[`
`,(0,n.jsxs)(l.p,{children:[`For Li there is a `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`2s\\rightarrow 2p`}),` transition at 671 nm.`]}),`
`]}),`
`,(0,n.jsxs)(l.li,{children:[`
`,(0,n.jsxs)(l.p,{children:[`For Na there is a `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`3s\\rightarrow 3p`}),` transition at 589 nm.`]}),`
`]}),`
`,(0,n.jsxs)(l.li,{children:[`
`,(0,n.jsxs)(l.p,{children:[`For K there is a `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`4s\\rightarrow 4p`}),` transition at 767 nm and 770nm.`]}),`
`]}),`
`,(0,n.jsxs)(l.li,{children:[`
`,(0,n.jsxs)(l.p,{children:[`For Rb there is a `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`5s\\rightarrow 5p`}),` transition at 780 nm and at
795nm.`]}),`
`]}),`
`,(0,n.jsxs)(l.li,{children:[`
`,(0,n.jsxs)(l.p,{children:[`For Cs there is a `,(0,n.jsx)(l.code,{className:`language-math math-inline`,children:`6s\\rightarrow 6p`}),` transition at 852 nm and at
894nm.`]}),`
`]}),`
`]}),`
`,(0,n.jsx)(l.p,{children:`What is the origin of these doublets ? The scaling of the splitting with
the nucleus indicates relativistic origins and the splitting is indeed
due to spin-orbit coupling, which we will discuss in the next lecture.`})]})}function d(e={}){let{wrapper:t}=e.components||{};return t?(0,n.jsx)(t,{...e,children:(0,n.jsx)(u,{...e})}):u(e)}export{d as default,l as frontmatter};