import{t as e}from"./chunk-BLhQqvoO.js";import{t}from"./chunk-BcD_3RzP.js";var n=e(),r=`/assets/static/lecture6_pic1.n6Mir5lP.png`,i=`/assets/static/lecture6_pic2.B5mt3pP3.png`,a=`/assets/static/lecture6_pic3.D6FrER_i.png`,o=`/assets/static/lecture6_pic4.D8eycG7l.png`,s=`/assets/static/lecture6_pic5.9HdctN0W.png`,c=`/assets/static/lecture6_pic6.BFgZtziR.svg`,l=`/assets/static/lecture6_pic7.BkRloi2M.svg`,u={author:[`fretchen`,`Selim Jochim`],order:6,title:`Lecture 6 - The dipole approximation in the hydrogen atom`};function d(e){let u={a:`a`,code:`code`,em:`em`,h1:`h1`,h2:`h2`,li:`li`,p:`p`,pre:`pre`,strong:`strong`,ul:`ul`,...e.components};return(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)(u.p,{children:`We will continue with some properties of the hydrogen atom. First
compare it to the harmonic oscillator, then look into dipole transitions
and end with the coupling to static magnetic fields.`}),`
`,(0,n.jsx)(u.p,{children:`In the last lecture, we discussed the basic properties of the
hydrogen atom and found its eigenstates. We will now summarize the most
important properties and look into its orbitals. From that we will
understand the understand the interaction with electromagnetic waves and
introduce the selection rules for dipole transitions.`}),`
`,(0,n.jsx)(u.h1,{children:`The energies of Hydrogen and its wavefunctions`}),`
`,(0,n.jsx)(u.p,{children:`In the last lecture, we looked into hydrogen and saw that we could write
it's Hamiltonian as:`}),`
`,(0,n.jsx)(u.pre,{children:(0,n.jsx)(u.code,{className:`language-math math-display`,children:`\\hat{H}_\\text{atom} = \\hat{H}_r + \\frac{\\hat{L}}{2\\mu r^2}+V(r) \\\\
\\hat{H}_r = -\\frac{\\hbar^2}{2\\mu}\\frac{1}{r^2}\\frac{\\partial}{\\partial r}\\left(r^2\\frac{\\partial}{\\partial r}\\right)`})}),`
`,(0,n.jsx)(u.p,{children:`We could then separate out the angular part and
decompose it as:`}),`
`,(0,n.jsx)(u.pre,{children:(0,n.jsx)(u.code,{className:`language-math math-display`,children:`\\psi (r,\\theta,\\phi) = \\frac{u(r)}{r} Y_{lm}(\\theta,\\phi)`})}),`
`,(0,n.jsx)(u.p,{children:`The radial wave equation reads then:`}),`
`,(0,n.jsx)(u.pre,{children:(0,n.jsx)(u.code,{className:`language-math math-display`,children:`
-\\frac{\\hbar^2}{2\\mu}\\frac{d^2}{dr^2}u(r) +\\underbrace{ \\left( -\\frac{Ze^2}{4\\pi\\epsilon_0 r} + \\frac{\\hbar^2}{2\\mu} \\frac{l(l+1)}{r^2} \\right)}_{V_{\\text{eff}}} u(r) = E \\, u(r),`})}),`
`,(0,n.jsx)(u.h2,{children:`Energy scales`}),`
`,(0,n.jsx)(u.p,{children:`We can now make the last equation dimensionless, by rewriting:`}),`
`,(0,n.jsx)(u.pre,{children:(0,n.jsx)(u.code,{className:`language-math math-display`,children:`r = \\rho \\tilde{a}_{0}`})}),`
`,(0,n.jsx)(u.p,{children:`So we rewrite:`}),`
`,(0,n.jsx)(u.pre,{children:(0,n.jsx)(u.code,{className:`language-math math-display`,children:`-\\frac{\\hbar^2}{2\\mu \\tilde{a}_{0}^2}\\frac{d^2}{d\\rho^2}u(r) + \\left( -\\frac{Ze^2}{4\\pi\\epsilon_0\\tilde{a}_{0}}\\frac{1}{\\rho} + \\frac{\\hbar^2}{2\\mu \\tilde{a}_{0}^2} \\frac{l(l+1)}{\\rho^2} \\right) u(r) = E \\, u(r),`})}),`
`,(0,n.jsx)(u.p,{children:`This allows us to measure energies in units of:`}),`
`,(0,n.jsx)(u.pre,{children:(0,n.jsx)(u.code,{className:`language-math math-display`,children:`E = \\epsilon R_{y,\\textrm{m}}\\\\
R_{y,\\textrm{m}} = -\\frac{\\hbar^2}{2\\mu \\tilde{a}_{0}^2}`})}),`
`,(0,n.jsx)(u.p,{children:`The equation reads then:`}),`
`,(0,n.jsx)(u.pre,{children:(0,n.jsx)(u.code,{className:`language-math math-display`,children:`\\frac{d^2}{d\\rho^2}u(\\rho) + \\left( \\frac{\\mu Ze^2 \\tilde{a}_{0}}{\\hbar^2 4\\pi\\epsilon_0}\\frac{2}{\\rho} - \\frac{l(l+1)}{\\rho^2} \\right) u(\\rho) = \\epsilon u(\\rho),`})}),`
`,(0,n.jsx)(u.p,{children:`If we finally set`}),`
`,(0,n.jsx)(u.pre,{children:(0,n.jsx)(u.code,{className:`language-math math-display`,children:`\\tilde{a}_{0}=\\frac{4\\pi\\epsilon_0 \\hbar^2}{\\mu Z e^2}`})}),`
`,(0,n.jsx)(u.p,{children:`We obtain the especially elegant formulation:`}),`
`,(0,n.jsx)(u.pre,{children:(0,n.jsx)(u.code,{className:`language-math math-display`,children:`\\frac{d^2}{d\\rho^2}u(\\rho) + \\left( \\frac{2}{\\rho} - \\frac{l(l+1)}{\\rho^2} \\right) u(\\rho) = \\epsilon u(\\rho),`})}),`
`,(0,n.jsxs)(u.p,{children:[`We typically call `,(0,n.jsx)(u.code,{className:`language-math math-inline`,children:`\\tilde{a}_{0}`}),` the `,(0,n.jsx)(u.strong,{children:`Bohr radius`}),`
for an atom with reduced mass `,(0,n.jsx)(u.code,{className:`language-math math-inline`,children:`\\mu`}),` and with a nucleus with charge
number `,(0,n.jsx)(u.code,{className:`language-math math-inline`,children:`Z`}),`. `,(0,n.jsx)(u.code,{className:`language-math math-inline`,children:`R_{y,\\textrm{m}}`}),` is the `,(0,n.jsx)(u.strong,{children:`Rydberg energy`}),` of such an
atom.`]}),`
`,(0,n.jsxs)(u.p,{children:[`The universal constant is defined for the infinite mass limit
`,(0,n.jsx)(u.code,{className:`language-math math-inline`,children:`\\mu \\approx m_e`}),` and for `,(0,n.jsx)(u.code,{className:`language-math math-inline`,children:`Z=1`}),`. As a length scale we introduce the Bohr
radius for infinite nuclear mass`]}),`
`,(0,n.jsx)(u.pre,{children:(0,n.jsx)(u.code,{className:`language-math math-display`,children:`a_0 = \\frac{4\\pi\\epsilon_0\\hbar^2}{m_e e^2} = 0.5\\text{angstrom} = 0.05 \\text{nm}.`})}),`
`,(0,n.jsx)(u.p,{children:`The energy scale reads:`}),`
`,(0,n.jsx)(u.pre,{children:(0,n.jsx)(u.code,{className:`language-math math-display`,children:`R_{y,\\infty} = \\frac{m_e e^4}{32 \\pi^2 \\epsilon_0^2 \\hbar^2}\\\\
\\approx 2.179e-18\\textrm{J}\\\\
 \\approx e \\times 13.6\\textrm{eV}\\\\
\\approx h \\times 3289\\textrm{THz}`})}),`
`,(0,n.jsx)(u.p,{children:`So if we excite the hydrogen atom for time scales of a
few attoseconds, we will coherently create superposition states of all
existing levels. But which ones ? And at which frequency ?`}),`
`,(0,n.jsx)(u.h2,{children:`Solution of the radial wave equation`}),`
`,(0,n.jsx)(u.p,{children:`At this stage we can have a look into the energy landscape:`}),`
`,(0,n.jsx)(t,{id:`fig-hydrogen-energy-potential`,href:r,caption:`Energy potential of the hydrogen atom`}),`
`,(0,n.jsx)(u.p,{children:`The energies read then`}),`
`,(0,n.jsx)(u.pre,{children:(0,n.jsx)(u.code,{className:`language-math math-display`,children:`E_n = -\\frac{R_{y,\\textrm{m}}}{n^2} \\qquad \\text{with} \\qquad  n=1,2,3,\\cdots`})}),`
`,(0,n.jsxs)(u.p,{children:[`for `,(0,n.jsx)(u.code,{className:`language-math math-inline`,children:`l=0`}),` and`]}),`
`,(0,n.jsx)(u.pre,{children:(0,n.jsx)(u.code,{className:`language-math math-display`,children:`E_n = -\\frac{R_{y,\\textrm{m}}}{n^2} \\qquad \\text{with} \\qquad  n=2,3,4,\\cdots`})}),`
`,(0,n.jsxs)(u.p,{children:[`for `,(0,n.jsx)(u.code,{className:`language-math math-inline`,children:`l=1`}),`. Despite the different effective potentials, we get the
same eigenstates. This looks like an accidental degeneracy. Actually,
there is a hidden symmetry which comes from the so-called "Runge-Lenz"
vector. It only occurs in an attractive `,(0,n.jsx)(u.code,{className:`language-math math-inline`,children:`1/r`}),`-potential . This
vector reads: `,(0,n.jsx)(u.code,{className:`language-math math-inline`,children:`\\mathbf{A} =\\mathbf{p}\\times\\mathbf{L}-\\mathbf{r}`})]}),`
`,(0,n.jsx)(u.p,{children:`Finally, we can also visualize the radial wavefunctions for the hydrogen
atom as shown below`}),`
`,(0,n.jsx)(t,{id:`fig-hydrogen-radial-wavefunctions`,href:i,caption:`Radial wavefunctions for the hydrogen atom`}),`
`,(0,n.jsxs)(u.p,{children:[`Associated with these radial wavefunctions, we also have the angular
profiles. Where `,(0,n.jsx)(u.code,{className:`language-math math-inline`,children:`Y_{lm}(\\theta, \\phi)`}),` are the `,(0,n.jsx)(u.strong,{children:`spherical harmonics`}),`
as shown below`]}),`
`,(0,n.jsx)(t,{id:`fig-spherical-harmonics`,href:a,caption:`Spherical harmonics`}),`
`,(0,n.jsx)(u.p,{children:`Their shape is especially important for understanding the possibility of
coupling different orbits through electromagnetic waves.`}),`
`,(0,n.jsx)(u.h1,{children:`The electric dipole approximation`}),`
`,(0,n.jsxs)(u.p,{children:[`Below you see the interaction between an atom and an electromagnetic wave `,(0,n.jsx)(u.code,{className:`language-math math-inline`,children:`\\vec{E}`}),` with
wave vector `,(0,n.jsx)(u.code,{className:`language-math math-inline`,children:`\\vec{k}`}),`. The states `,(0,n.jsx)(u.code,{className:`language-math math-inline`,children:`\\text{|g>}`}),` and\xA0`,(0,n.jsx)(u.code,{className:`language-math math-inline`,children:`\\text{|e>}`}),` stand
for the ground and excited state and `,(0,n.jsx)(u.code,{className:`language-math math-inline`,children:`\\hbar\\omega_0`}),` is the energy of
the resonant transition between the states.`]}),`
`,(0,n.jsx)(t,{id:`fig-atom-em-wave-interaction`,href:o,caption:`Interaction between an atom and an electromagnetic wave`}),`
`,(0,n.jsxs)(u.p,{children:[`We consider an atom which is located in a radiation field. By resonant
coupling with the frequency `,(0,n.jsx)(u.code,{className:`language-math math-inline`,children:`\\omega_0`}),`, it can go from the ground state
`,(0,n.jsx)(u.code,{className:`language-math math-inline`,children:`\\left|g\\right\\rangle`}),` to the excited state
`,(0,n.jsx)(u.code,{className:`language-math math-inline`,children:`\\left|e\\right\\rangle`}),`.`]}),`
`,(0,n.jsxs)(u.p,{children:[`The potential energy of a charge distribution in a homogeneous
electromagnetic field `,(0,n.jsx)(u.code,{className:`language-math math-inline`,children:`\\vec{E}`}),` is:`]}),`
`,(0,n.jsx)(u.pre,{children:(0,n.jsx)(u.code,{className:`language-math math-display`,children:`E_\\text{pot} = \\sum_i q_i \\vec{r}_i\\cdot \\vec{E}.`})}),`
`,(0,n.jsx)(u.p,{children:`If the upper limit of the sum is 2, we obtain the dipole
moment`}),`
`,(0,n.jsx)(u.pre,{children:(0,n.jsx)(u.code,{className:`language-math math-display`,children:`\\vec{D} = e \\vec{r}.`})}),`
`,(0,n.jsx)(u.p,{children:`For the hydrogen atom, the distance corresponds to the
Bohr radius.`}),`
`,(0,n.jsx)(t,{id:`fig-dipole-potential`,href:s,caption:`Dipole potential visualization`}),`
`,(0,n.jsxs)(u.p,{children:[(0,n.jsx)(u.strong,{children:`Note.`}),` Apart from the monopole, the dipole potential is the lowest
order term of the multipole expansion of the scalar potential `,(0,n.jsx)(u.code,{className:`language-math math-inline`,children:`\\phi`}),`:`]}),`
`,(0,n.jsx)(u.pre,{children:(0,n.jsx)(u.code,{className:`language-math math-display`,children:`\\phi \\left( \\vec{r} \\right) = \\frac{1}{4\\pi\\epsilon_0}\\frac{\\vec{D}\\cdot\\vec{r}}{|\\vec{r}|^3}\\\\
\\vec{E}(\\vec{r})= \\vec{\\nabla}\\phi(\\vec{r}) = \\frac{ 3 \\left(\\vec{D}\\cdot \\vec{r}\\right) \\vec{r}/{|\\vec{r}|^2}- \\vec{D}}{4\\pi\\epsilon_0|\\vec{r}|^3}.`})}),`
`,(0,n.jsxs)(u.p,{children:[`For the dipole approximation we consider the size of the atom and
compare it to the wavelength `,(0,n.jsx)(u.code,{className:`language-math math-inline`,children:`\\lambda`}),` of the electromagnetic field:`]}),`
`,(0,n.jsx)(u.pre,{children:(0,n.jsx)(u.code,{className:`language-math math-display`,children:`\\left\\langle|r|\\right\\rangle \\sim 1\\text{angstrom}\\ll \\lambda \\sim 10^3\\text{angstrom}`})}),`
`,(0,n.jsxs)(u.ul,{children:[`
`,(0,n.jsx)(u.li,{children:`Therefore, we assume that the field is homogeneous in space and omit
the spatial dependence:`}),`
`]}),`
`,(0,n.jsx)(u.pre,{children:(0,n.jsx)(u.code,{className:`language-math math-display`,children:`    E(r,t) \\approx E(t)



`})}),`
`,(0,n.jsxs)(u.ul,{children:[`
`,(0,n.jsx)(u.li,{children:`The correction term resulting from the semi-classical dipole
approximation then is`}),`
`]}),`
`,(0,n.jsx)(u.pre,{children:(0,n.jsx)(u.code,{className:`language-math math-display`,children:`    \\hat{H}_1(t)=-e\\hat{\\vec{r}} \\cdot \\vec{E}(t) = -\\hat{\\vec{D}} \\cdot \\vec{E}(t)



`})}),`
`,(0,n.jsxs)(u.ul,{children:[`
`,(0,n.jsxs)(u.li,{children:[`Why can the magnetic field be ignored in this approximation? The
velocity of an electron is `,(0,n.jsx)(u.code,{className:`language-math math-inline`,children:`\\sim \\alpha c`}),`. The hydrogen atom only
has small relativistic corrections. If we compare the modulus of the
magnetic and the electric field, we get:`]}),`
`]}),`
`,(0,n.jsx)(u.pre,{children:(0,n.jsx)(u.code,{className:`language-math math-display`,children:`    \\left| \\vec{B} \\right| = \\frac{|\\vec{E}|}{c}`})}),`
`,(0,n.jsx)(u.p,{children:`The electric field contribution thus dominates. Now we choose`}),`
`,(0,n.jsx)(u.pre,{children:(0,n.jsx)(u.code,{className:`language-math math-display`,children:`\\vec{E} = E_0 \\vec{\\epsilon} \\cos \\left(\\omega t - \\vec{k} \\cdot \\vec{r}\\right)`})}),`
`,(0,n.jsx)(u.p,{children:`and do time-dependent perturbation theory:`}),`
`,(0,n.jsx)(u.pre,{children:(0,n.jsx)(u.code,{className:`language-math math-display`,children:`\\left|\\psi(t)\\right\\rangle = \\gamma_1(t) \\mathrm{e}^{-iE_1t/\\hbar} \\left|1\\right\\rangle + \\gamma_2(t) \\mathrm{e}^{-iE_2t/\\hbar} \\left|2\\right\\rangle\\\\
+\\sum_{n=3}^\\infty \\gamma_n \\mathrm{e}^{-iE_nt/\\hbar} \\left|n\\right\\rangle`})}),`
`,(0,n.jsx)(u.p,{children:`As initial condition we choose`}),`
`,(0,n.jsx)(u.pre,{children:(0,n.jsx)(u.code,{className:`language-math math-display`,children:` \\gamma_i(0) = \\left\\{ \\begin{array}{ccc} 1 &\\text{for}&  i=1 \\\\ 0 &\\text{for}& i>1  \\end{array} \\right.`})}),`
`,(0,n.jsxs)(u.p,{children:[`We write `,(0,n.jsx)(u.code,{className:`language-math math-inline`,children:`\\omega_0 = (E_2-E_1)/\\hbar`}),` and get to first
order `,(0,n.jsx)(u.code,{className:`language-math math-inline`,children:`\\hat{\\vec{D}}`}),`:`]}),`
`,(0,n.jsx)(u.pre,{children:(0,n.jsx)(u.code,{className:`language-math math-display`,children:`\\gamma_2(t) = \\overbrace{\\frac{E_0}{2\\hbar} \\left\\langle 2|\\hat{\\vec{D}}\\cdot \\vec{\\epsilon}|1\\right\\rangle}^{\\text{Rabi frequency }\\Omega} \\underbrace{\\left(\\frac{\\mathrm{e}^{i(\\omega_0 + \\omega)t}-1}{\\omega_0 + \\omega} + \\frac{\\mathrm{e}^{i(\\omega_0 - \\omega)t}-1}{\\omega_0 - \\omega}\\right)}_{\\text{time evolution of the system}}`})}),`
`,(0,n.jsx)(u.p,{children:`The term before the round brackets is called dipole
matrix element:`}),`
`,(0,n.jsx)(u.pre,{children:(0,n.jsx)(u.code,{className:`language-math math-display`,children:`
\\left\\langle 2|\\hat{\\vec{D}}\\cdot \\vec{\\epsilon}\\,|1\\right\\rangle =e \\int \\psi_2\\left(\\vec{r}\\right) \\cdot \\vec{r} \\cdot \\vec{\\epsilon} \\cdot \\psi_1\\left(\\vec{r}\\right) \\mathop{}\\!\\mathrm{d}\\vec{r}.`})}),`
`,(0,n.jsx)(t,{id:`fig-dipole-matrix-element`,href:c,caption:`Dipole matrix element`}),`
`,(0,n.jsx)(u.h1,{children:`Selection rules`}),`
`,(0,n.jsx)(u.p,{children:`We can now look into the allowed transition in the atom as they are what
we will typically observe within experiments.`}),`
`,(0,n.jsx)(u.h2,{children:`Change of parity`}),`
`,(0,n.jsx)(u.p,{children:`The parity operator is defined as:`}),`
`,(0,n.jsx)(u.pre,{children:(0,n.jsx)(u.code,{className:`language-math math-display`,children:`\\hat{P}\\psi(\\vec{r}) = \\psi(-\\vec{r})`})}),`
`,(0,n.jsx)(u.p,{children:`For the eigenfunction we have:`}),`
`,(0,n.jsx)(u.pre,{children:(0,n.jsx)(u.code,{className:`language-math math-display`,children:`\\hat{P} \\psi(\\vec{r}) = \\lambda \\psi(\\vec{r})\\\\
\\lambda = \\pm 1`})}),`
`,(0,n.jsxs)(u.p,{children:[`The eigenvalues are called `,(0,n.jsx)(u.em,{children:`odd`}),` and `,(0,n.jsx)(u.em,{children:`even`}),`. From the
definition of the dipole operator we can see that it is of odd parity.
What about the parity of the states that it is coupling ? If they have
both the same parity than the whole integral will disappear and no
dipole transition can appear.`]}),`
`,(0,n.jsx)(u.p,{children:`We can become more concrete for the given eigenfunctions as we have
within spherical coordinates:`}),`
`,(0,n.jsx)(u.pre,{children:(0,n.jsx)(u.code,{className:`language-math math-display`,children:`(r, \\theta, \\phi) \\rightarrow (r, \\pi -\\theta, \\phi+\\pi)`})}),`
`,(0,n.jsx)(u.p,{children:`For the orbitals of the hydrogen atom we then have
explicitly:`}),`
`,(0,n.jsx)(u.pre,{children:(0,n.jsx)(u.code,{className:`language-math math-display`,children:`\\hat{P}\\psi_{nlm}(r, \\theta, \\phi) = R_{nl}(r)Y_{lm}(\\pi -\\theta, \\phi+\\pi)\\\\
= (-1)^l R_{nl}(r)Y_{lm}(, \\theta, \\phi)`})}),`
`,(0,n.jsxs)(u.p,{children:[`This gives us the first selection rule that the
`,(0,n.jsx)(u.strong,{children:`orbital angular momentum has to change for dipole transitions`}),`
`,(0,n.jsx)(u.code,{className:`language-math math-inline`,children:`\\Delta  l = \\pm 1`}),`.`]}),`
`,(0,n.jsxs)(u.ul,{children:[`
`,(0,n.jsxs)(u.li,{children:[`
`,(0,n.jsxs)(u.p,{children:[(0,n.jsx)(u.code,{className:`language-math math-inline`,children:`s`}),` orbitals are only coupled to `,(0,n.jsx)(u.code,{className:`language-math math-inline`,children:`p`}),` orbitals through dipole
transitions.`]}),`
`]}),`
`,(0,n.jsxs)(u.li,{children:[`
`,(0,n.jsxs)(u.p,{children:[(0,n.jsx)(u.code,{className:`language-math math-inline`,children:`p`}),` orbitals are only coupled to `,(0,n.jsx)(u.code,{className:`language-math math-inline`,children:`s`}),` and `,(0,n.jsx)(u.code,{className:`language-math math-inline`,children:`d`}),` orbitals through dipole
transitions.`]}),`
`]}),`
`]}),`
`,(0,n.jsx)(u.h2,{children:`Coupling for linearly polarized light`}),`
`,(0,n.jsxs)(u.p,{children:[`Having established the need for parity change, we also need to
investigate the influence of the polarization of the light, which enters
the dipole operator through the vector `,(0,n.jsx)(u.code,{className:`language-math math-inline`,children:`\\epsilon`}),`. In the simplest case
the light has linear polarization (`,(0,n.jsx)(u.code,{className:`language-math math-inline`,children:`\\pi`}),` polarized) and we can write:`]}),`
`,(0,n.jsx)(u.pre,{children:(0,n.jsx)(u.code,{className:`language-math math-display`,children:`\\vec{E}(t) = \\vec{e}_zE_0 \\cos(\\omega t +\\varphi)`})}),`
`,(0,n.jsx)(u.p,{children:`This means that the dipole transition element is now given by:`}),`
`,(0,n.jsx)(u.pre,{children:(0,n.jsx)(u.code,{className:`language-math math-display`,children:`\\left\\langle 2\\right|\\vec{D}\\cdot\\vec{e}_z\\left|1\\right\\rangle = e \\int \\psi_2(\\vec{r}) z \\psi_1\\left(\\vec{r}\\right) \\mathop{}\\!\\mathrm{d}\\vec{r}`})}),`
`,(0,n.jsxs)(u.p,{children:[`We can now transform z into the spherical coordinates
`,(0,n.jsx)(u.code,{className:`language-math math-inline`,children:`z= r \\cos(\\theta) = r\\sqrt{\\frac{4\\pi}{3}}Y_{10}(\\theta, \\phi)`}),`. We can
further separate out the angular part of the integral to obtain:`]}),`
`,(0,n.jsx)(u.pre,{children:(0,n.jsx)(u.code,{className:`language-math math-display`,children:`\\left\\langle 2\\right|\\vec{D}\\cdot\\vec{e}_z\\left|1\\right\\rangle \\propto e \\int \\sin(\\theta) d\\theta d\\varphi Y_{l',m'}(\\theta, \\varphi) Y_{10}(\\theta, \\phi) Y_{l,m}(\\theta, \\varphi)`})}),`
`,(0,n.jsxs)(u.p,{children:[`This element is only non-zero if `,(0,n.jsx)(u.code,{className:`language-math math-inline`,children:`m = m'`}),` (see `,(0,n.jsx)(u.a,{href:`http://dx.doi.org/10.1007/978-3-642-54322-7`,children:`appendix
C of Hertel 2015`}),` for all the gorious details).`]}),`
`,(0,n.jsx)(t,{id:`fig-dipole-selection-rules`,href:l,caption:`Dipole selection rules for different polarizations of light`}),`
`,(0,n.jsx)(u.h2,{children:`Circularly polarized light`}),`
`,(0,n.jsx)(u.p,{children:`Light has not just linear polarization, but it might also have some
circular polarization. In this case we can write:`}),`
`,(0,n.jsx)(u.pre,{children:(0,n.jsx)(u.code,{className:`language-math math-display`,children:`\\vec{E}(t) = \\frac{E_0}{\\sqrt{2}} \\left(\\cos(\\omega t +\\varphi)\\vec{e}_x + \\sin(\\omega t +\\varphi)\\vec{e}_y\\right)\\\\
\\vec{E}(t) = \\text{Re}\\left(\\vec{e}_+ E_0 e^{-i\\omega t +\\phi}\\right)\\\\
\\vec{e}_\\pm = \\frac{\\vec{e}_x\\pm i\\vec{e}_y}{\\sqrt{2}}`})}),`
`,(0,n.jsxs)(u.p,{children:[`So light with polarization `,(0,n.jsx)(u.code,{className:`language-math math-inline`,children:`\\vec{\\epsilon} = \\vec{e}_+`}),`
is called right-hand circular (`,(0,n.jsx)(u.code,{className:`language-math math-inline`,children:`\\sigma^+`}),`) and
`,(0,n.jsx)(u.code,{className:`language-math math-inline`,children:`\\vec{\\epsilon} = \\vec{e}_-`}),` is called left-hand circular (`,(0,n.jsx)(u.code,{className:`language-math math-inline`,children:`\\sigma^-`}),`).
Let us now evaluate the transition elements here. The dipole operator
element boils now down to the evaluation of the integral:`]}),`
`,(0,n.jsx)(u.pre,{children:(0,n.jsx)(u.code,{className:`language-math math-display`,children:`\\left\\langle l',m',n'\\right|x+iy\\left|l,m,n\\right\\rangle`})}),`
`,(0,n.jsx)(u.p,{children:`As previously we can express the coupling term in
spherical coordinates:`}),`
`,(0,n.jsx)(u.pre,{children:(0,n.jsx)(u.code,{className:`language-math math-display`,children:`\\frac{x+iy}{\\sqrt{2}} = -r \\sqrt{\\frac{4\\pi}{3}}Y_{11}(\\theta, \\varphi)`})}),`
`,(0,n.jsxs)(u.p,{children:[`Evaluation of the integrals lead now to the rule the
projection of the quantum number has to change `,(0,n.jsx)(u.code,{className:`language-math math-inline`,children:`m' = m+1`}),`. In a similiar
fashion we find for left-hand circular light the selection rule
`,(0,n.jsx)(u.code,{className:`language-math math-inline`,children:`m' = m - 1`}),`.`]}),`
`,(0,n.jsx)(u.p,{children:`In the next lecture, we will investigate the influence of
perturbative effects and see how the fine structure arises.`})]})}function f(e={}){let{wrapper:t}=e.components||{};return t?(0,n.jsx)(t,{...e,children:(0,n.jsx)(d,{...e})}):d(e)}export{f as default,u as frontmatter};