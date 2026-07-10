import{Cn as e}from"./chunk-YPwviyFJ.js";import{t}from"./chunk-BNReSP_g2.js";var n=e(),r=`/assets/static/lecture8_pic1.DVp3UuuI.png`,i=`/assets/static/lecture8_pic2.Biv4mitX.svg`,a={author:[`fretchen`,`Selim Jochim`],order:8,title:`Lecture 8 - The Helium atom`};function o(e){let a={a:`a`,code:`code`,em:`em`,h2:`h2`,h3:`h3`,li:`li`,ol:`ol`,p:`p`,pre:`pre`,section:`section`,strong:`strong`,sup:`sup`,ul:`ul`,...e.components};return(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)(a.p,{children:`In this lecture we will discuss some basic properties of the Helium
atom. We will introduce first some useful notations for the specific
Hamiltonian at hand. Then we will focus on the important consequences
played by the electron-electron interaction on the spin structure and
the level scheme of the system. Finally, we will introduce the
variational method for the estimation of the ground state energy.`}),`
`,(0,n.jsx)(a.p,{children:`In todays lecture, we will see how the electron spin couples to the
orbital angular momentum and how this creates spin-orbit coupling. We
will then start out with the discussion of the Helium atom.`}),`
`,(0,n.jsx)(a.h2,{children:`Spin-orbit coupling`}),`
`,(0,n.jsxs)(a.p,{children:[`The third term, which arises from the Dirac equation is the spin-orbit
coupling. We will give here a common hand-waving explanation in a
similiar spirit to the discussion of the magnetic moment `,(0,n.jsx)(a.a,{href:`http://dx.doi.org/10.1007/978-3-642-10298-1`,children:`for given
angular momentum`}),`. Please, be aware that it misses a
factor of 2. The electron has a spin 1/2 and hence a magnetic moment
`,(0,n.jsx)(a.code,{className:`language-math math-inline`,children:`\\vec{M}_S = -g_e \\mu_B \\frac{\\vec{S}}{\\hbar}`}),`. This magnetic moment
experiences a magnetic field, simply due to the motion of the electron
charge itself. Assuming a circular motion of the electron, we obtain the
magnetic field amplitude:`]}),`
`,(0,n.jsx)(a.pre,{children:(0,n.jsx)(a.code,{className:`language-math math-display`,children:`B = \\frac{\\mu_0 i}{2r}\\\\
B = \\frac{\\mu_0 ev}{4\\pi r^2}\\\\
B = \\frac{\\mu_0 e}{4\\pi m_e r^3}L\\\\`})}),`
`,(0,n.jsxs)(a.p,{children:[`Through the coupling with the spin and introducing a
fudge factor of 2 `,(0,n.jsx)(a.sup,{children:(0,n.jsx)(a.a,{href:`#user-content-fn-1`,id:`user-content-fnref-1`,"data-footnote-ref":!0,"aria-describedby":`footnote-label`,children:`1`})}),`, we obtain the Hamiltonian:`]}),`
`,(0,n.jsx)(a.pre,{children:(0,n.jsx)(a.code,{className:`language-math math-display`,children:`
\\hat{H}_{LS} = \\frac{g_e}{4\\pi \\epsilon_0}\\frac{e^2}{2m_e^2c^2 r^3}  \\hat{\\vec{L}}\\cdot \\hat{\\vec{S}}`})}),`
`,(0,n.jsxs)(a.p,{children:[`How does it act on a state `,(0,n.jsx)(a.code,{className:`language-math math-inline`,children:`\\left|\\psi\\right\\rangle`}),`? For
the example`]}),`
`,(0,n.jsx)(a.pre,{children:(0,n.jsx)(a.code,{className:`language-math math-display`,children:`\\left|\\psi\\right\\rangle = \\left|m_l\\right\\rangle \\otimes \\left|m_s\\right\\rangle`})}),`
`,(0,n.jsx)(a.p,{children:`we get:`}),`
`,(0,n.jsx)(a.pre,{children:(0,n.jsx)(a.code,{className:`language-math math-display`,children:`\\hat{L}_z \\cdot \\hat{S}_z \\left( \\left|m_l\\right\\rangle \\otimes \\left|m_s\\right\\rangle \\right)
= \\hbar^2 m_l \\cdot m_s (\\left|m_l\\right\\rangle \\otimes \\left|m_s\\right\\rangle)`})}),`
`,(0,n.jsx)(a.p,{children:`The states`}),`
`,(0,n.jsx)(a.pre,{children:(0,n.jsx)(a.code,{className:`language-math math-display`,children:`\\left|n,l,m_l\\right\\rangle \\otimes \\left|s,m_s\\right\\rangle.`})}),`
`,(0,n.jsx)(a.p,{children:`span the complete Hilbert space. Any state of the atom can be
represented by:`}),`
`,(0,n.jsx)(a.pre,{children:(0,n.jsx)(a.code,{className:`language-math math-display`,children:`\\left|\\psi\\right\\rangle = \\sum_{\\{n,l,m_l,m_s\\}} c_{n,l,m_l,m_s} \\left|n,l,m_l,m_s\\right\\rangle.`})}),`
`,(0,n.jsx)(a.p,{children:`As usual we can massively simplify the problem by using
the appropiate conserved quantities.`}),`
`,(0,n.jsx)(a.h3,{children:`Conservation of total angular momentum`}),`
`,(0,n.jsxs)(a.p,{children:[`We can look into it a bit further into the details and see that the
Hamiltonian `,(0,n.jsx)(a.code,{className:`language-math math-inline`,children:`\\hat{H}_\\textrm{LS}`}),` does not commute with `,(0,n.jsx)(a.code,{className:`language-math math-inline`,children:`\\hat{L}_z`}),`:`]}),`
`,(0,n.jsx)(a.pre,{children:(0,n.jsx)(a.code,{className:`language-math math-display`,children:`= [L_z, L_x S_x + L_y S_y + L_z S_z]\\\\
[L_z, \\vec{L}\\cdot \\vec{S}] = [L_z, L_x ]S_x + [L_z,  L_y  ]S_y\\\\
[L_z, \\vec{L}\\cdot \\vec{S}] = i\\hbar L_y S_x -i\\hbar L_x S_y\\neq 0`})}),`
`,(0,n.jsxs)(a.p,{children:[`This suggests that `,(0,n.jsx)(a.code,{className:`language-math math-inline`,children:`L_z`}),` is not a good quantum number
anymore. We have to include the spin degree of freedom into the
description. Let us repeat the same procedure for the spin projection:`]}),`
`,(0,n.jsx)(a.pre,{children:(0,n.jsx)(a.code,{className:`language-math math-display`,children:`= [S_z, L_x S_x + L_y S_y + L_z S_z]\\\\
[S_z, \\vec{L}\\cdot \\vec{S}] = L_x [S_z,  S_x] + L_y [S_z,  S_y]\\\\
[S_z, \\vec{L}\\cdot \\vec{S}] = i\\hbar L_x S_y -i\\hbar L_y S_x\\neq 0`})}),`
`,(0,n.jsxs)(a.p,{children:[`This implies that the spin projection is not a conserved
quantity either. However, the sum of spin and orbital angular momentum
will commute `,(0,n.jsx)(a.code,{className:`language-math math-inline`,children:`[L_z + S_z, \\vec{L}\\vec{S}] =0`}),` according to the above
calculations. Similiar calculations hold for the other components,
indicating that the `,(0,n.jsx)(a.em,{children:`total angular momentum`}),` is conserved `,(0,n.jsx)(a.sup,{children:(0,n.jsx)(a.a,{href:`#user-content-fn-2`,id:`user-content-fnref-2`,"data-footnote-ref":!0,"aria-describedby":`footnote-label`,children:`2`})}),`:`]}),`
`,(0,n.jsx)(a.pre,{children:(0,n.jsx)(a.code,{className:`language-math math-display`,children:`\\vec{J} = \\vec{L} + \\vec{S}`})}),`
`,(0,n.jsxs)(a.p,{children:[`We can now rewrite `,(0,n.jsx)(a.code,{className:`language-math math-inline`,children:`\\hat{H}_{LS}`}),` in terms of the conserved quantities through the following following
little trick:`]}),`
`,(0,n.jsx)(a.pre,{children:(0,n.jsx)(a.code,{className:`language-math math-display`,children:`\\hat{\\vec{J}}^2 = \\left( \\hat{\\vec{L}} + \\hat{\\vec{S}} \\right) ^2 = \\hat{\\vec{L}}^2 + 2 \\hat{\\vec{L}} \\cdot \\hat{\\vec{S}} + \\hat{\\vec{S}}^2\\\\
\\hat{\\vec{L}} \\cdot \\hat{\\vec{S}} = \\frac{1}{2} \\left( \\hat{\\vec{J}}^2 - \\hat{\\vec{L}}^2 - \\hat{\\vec{S}}^2 \\right)`})}),`
`,(0,n.jsxs)(a.p,{children:[`This directly implies that `,(0,n.jsx)(a.code,{className:`language-math math-inline`,children:`\\hat{J}^2`}),`, `,(0,n.jsx)(a.code,{className:`language-math math-inline`,children:`\\hat{L}^2`}),` and `,(0,n.jsx)(a.code,{className:`language-math math-inline`,children:`\\hat{S}^2`}),` are
new conserved quantities of the system. If we call `,(0,n.jsx)(a.code,{className:`language-math math-inline`,children:`\\hat{H}_0`}),` the
Hamiltonian of the hydrogen atom, we previously used the complete set of
commuting observables `,(0,n.jsx)(a.sup,{children:(0,n.jsx)(a.a,{href:`#user-content-fn-3`,id:`user-content-fnref-3`,"data-footnote-ref":!0,"aria-describedby":`footnote-label`,children:`3`})}),`:`]}),`
`,(0,n.jsx)(a.pre,{children:(0,n.jsx)(a.code,{className:`language-math math-display`,children:`\\left\\{ \\hat{H}_0, \\hat{\\vec{L}}^2, \\hat{L}_z,\\hat{\\vec{S}}^2, \\hat{S}_z \\right\\}`})}),`
`,(0,n.jsx)(a.p,{children:`We now use the complete set of commuting observables:`}),`
`,(0,n.jsx)(a.pre,{children:(0,n.jsx)(a.code,{className:`language-math math-display`,children:`\\left\\{ \\hat{H}_0 + \\hat{H}_{LS}, \\hat{\\vec{L}}^2,\\hat{\\vec{S}}^2, \\hat{\\vec{J}}^2, \\hat{J}_z \\right\\}.`})}),`
`,(0,n.jsxs)(a.p,{children:[`The corresponding basis states
`,(0,n.jsx)(a.code,{className:`language-math math-inline`,children:`\\left|n,l,j,m_j\\right\\rangle`}),` are given by:`]}),`
`,(0,n.jsx)(a.pre,{children:(0,n.jsx)(a.code,{className:`language-math math-display`,children:`\\left|n,l,j,m_j\\right\\rangle = \\sum_{m_l,m_s} \\left|n, l, m_l, m_s\\right\\rangle \\underbrace{\\left\\langle n, l, m_l, m_s | n, l, j, m_j\\right\\rangle}_{\\text{Clebsch-Gordan coefficients}}`})}),`
`,(0,n.jsxs)(a.p,{children:[`Here, the Clebsch-Gordan coefficients (cf. `,(0,n.jsx)(a.a,{href:`http://dx.doi.org/10.1088/1674-1137/38/9/090001`,children:`Olive 2014 p. 557`}),` or the `,(0,n.jsx)(a.a,{href:`http://pdg.lbl.gov/2002/clebrpp.pdf`,children:`PDG`}),`)
describe the coupling of angular momentum states.`]}),`
`,(0,n.jsx)(a.p,{children:(0,n.jsxs)(a.strong,{children:[`Example: `,(0,n.jsx)(a.code,{className:`language-math math-inline`,children:`l=1`}),` and `,(0,n.jsx)(a.code,{className:`language-math math-inline`,children:`s=1/2`}),`.`]})}),`
`,(0,n.jsxs)(a.p,{children:[`With the Clebsch-Gordan coefficients, the following example
states---given by `,(0,n.jsx)(a.code,{className:`language-math math-inline`,children:`Jj`}),` and `,(0,n.jsx)(a.code,{className:`language-math math-inline`,children:`m_j`}),`---can be expressed by linear
combinations of states defined by `,(0,n.jsx)(a.code,{className:`language-math math-inline`,children:`m_l`}),` and `,(0,n.jsx)(a.code,{className:`language-math math-inline`,children:`m_s`}),`:`]}),`
`,(0,n.jsx)(a.pre,{children:(0,n.jsx)(a.code,{className:`language-math math-display`,children:`\\left|j=\\frac{3}{2}, m_j = \\frac{3}{2}\\right\\rangle = \\left|m_l=1, m_s = +\\frac{1}{2}\\right\\rangle\\\\
\\left|j=\\frac{3}{2}, m_j = \\frac{1}{2}\\right\\rangle = \\sqrt{\\frac{1}{3}} \\left|m_l=1, m_s = -\\frac{1}{2}\\right\\rangle +\\sqrt{\\frac{2}{3}} \\left|m_l = 0, m_s = +\\frac{1}{2}\\right\\rangle`})}),`
`,(0,n.jsx)(a.h3,{children:`Summary of the relativistic shifts`}),`
`,(0,n.jsx)(a.p,{children:`We can now proceed to a summary of the relativistic effects in the
hydrogen atom as presented in Fig.`}),`
`,(0,n.jsx)(t,{id:`fig-hydrogen-fine-structure`,href:r,caption:`Fine structure of the Hydrogen atom`}),`
`,(0,n.jsxs)(a.ul,{children:[`
`,(0,n.jsxs)(a.li,{children:[`The states should be characterized by angular momentum anymore, but
by the total angular momentum `,(0,n.jsx)(a.code,{className:`language-math math-inline`,children:`J`}),` and the orbital angular momentum.
We introduce the notation:`]}),`
`]}),`
`,(0,n.jsx)(a.pre,{children:(0,n.jsx)(a.code,{className:`language-math math-display`,children:`    nl_{j}`})}),`
`,(0,n.jsxs)(a.ul,{children:[`
`,(0,n.jsxs)(a.li,{children:[`
`,(0,n.jsxs)(a.p,{children:[`All shifts are on the order of `,(0,n.jsx)(a.code,{className:`language-math math-inline`,children:`\\alpha^2`}),` and hence pertubative.`]}),`
`]}),`
`,(0,n.jsxs)(a.li,{children:[`
`,(0,n.jsxs)(a.p,{children:[`Some levels remain degenerate in relativistic theory, most
importantly the `,(0,n.jsx)(a.code,{className:`language-math math-inline`,children:`2s_{1/2}`}),` and the `,(0,n.jsx)(a.code,{className:`language-math math-inline`,children:`2p_{1/2}`}),` state.`]}),`
`]}),`
`]}),`
`,(0,n.jsx)(a.h2,{children:`The Lamb shift`}),`
`,(0,n.jsxs)(a.p,{children:[`The previous discussions studied the effects of the Dirac equation onto
our understanding of the Hydrogen atom. Most importantly, we saw that we
can test those predictions quite well through the shifts in the level
scheme. It is possible to push this analysis even further. One
particularly important candidate here are the degenerate levels
`,(0,n.jsx)(a.code,{className:`language-math math-inline`,children:`2s_{1/2}`}),` and `,(0,n.jsx)(a.code,{className:`language-math math-inline`,children:`2p_{1/2}`}),`. Being able to see any splitting here, will be
proof physics beyond the Dirac equation. And it is a relative
measurement, for which it therefore not necessary to have insane
absolute precisions. It is exactly this measurement that `,(0,n.jsx)(a.a,{href:`http://dx.doi.org/10.1103/physrev.72.241`,children:`Lamb and
Retherford undertook in 1947`}),`. They observed actually a
splitting of roughly `,(0,n.jsx)(a.code,{className:`language-math math-inline`,children:`1`}),`GHz, which they drove through direct
rf-transitions. The observed shift was immediately `,(0,n.jsx)(a.a,{href:`http://dx.doi.org/10.1103/physrev.72.339`,children:`explained by Bethe`}),` through the idea of QED a concept that we will come back
to later in this lecture in a much simpler context of cavity QED.`]}),`
`,(0,n.jsxs)(a.p,{children:[`We would simply like to add here that the long story of the hydrogen
atom and the Lamb shift is far from over as open questions remained
until September 2019. Basically, a group of people measured the radius
in some 'heavy' muonic hydrogen very `,(0,n.jsx)(a.a,{href:`http://dx.doi.org/10.1038/nature09250`,children:`precisely in 2010`}),`.
They could only explain them by changing the size of the proton radius,
which was previously assumed to be well measured. It was only this year
the another team reperformed a similiar measurement on electronic
hydrogen (the normal one), `,(0,n.jsx)(a.a,{href:`http://dx.doi.org/10.1126/science.aau7807`,children:`obtaining consistent results`}),`. A nice summary of the "proton radius puzzle" can be
found `,(0,n.jsx)(a.a,{href:`https://www.quantamagazine.org/physicists-finally-nail-the-protons-size-and-hope-dies-20190911/`,children:`here`}),`.`]}),`
`,(0,n.jsx)(a.h2,{children:`The helium problem`}),`
`,(0,n.jsxs)(a.p,{children:[`In this lecture we will discuss the Helium atom and what makes it so
interesting in the laboratory. We will most importantly see that you
cannot solve the problem exactly. This makes it a great historical
example where a simple system was used to test state-of-the-art
theories. An extensive discussion can be found in Chapter 7 of Bransden `,(0,n.jsx)(a.sup,{children:(0,n.jsx)(a.a,{href:`#user-content-fn-bransden`,id:`user-content-fnref-bransden`,"data-footnote-ref":!0,"aria-describedby":`footnote-label`,children:`4`})}),` or `,(0,n.jsx)(a.a,{href:`http://dx.doi.org/10.1007/978-3-642-10298-1`,children:`Chapter 6 of Demtröder 20210`}),`. Even nowadays, the system continues to be a nice test-bed of many-body theories, see for example the paper by `,(0,n.jsx)(a.a,{href:`http://dx.doi.org/10.1103/physrevx.7.041035`,children:`Combescot in 2017`}),` or by `,(0,n.jsx)(a.a,{href:`http://dx.doi.org/10.1103/physrevlett.123.203401`,children:`Ott in 2019`}),`..`]}),`
`,(0,n.jsx)(a.p,{children:`The Helium atom describes a two electron system as shown in the figure
below.`}),`
`,(0,n.jsx)(t,{id:`fig-helium-atom-schematic`,href:i,caption:`The helium atom with two electrons coupled to the nucleus`}),`
`,(0,n.jsxs)(a.p,{children:[`In the reference frame of center-of-mass we obtain the following
Hamiltonian:
`,(0,n.jsx)(a.code,{className:`language-math math-inline`,children:`H = -\\frac{\\hbar^2}{2\\mu}\\nabla_{r_1}^2 -\\frac{\\hbar^2}{2\\mu}\\nabla_{r_2}^2-\\frac{\\hbar^2}{M}\\nabla_{r_1}\\cdot\\nabla_{r_2}+\\frac{e^2}{4\\pi \\epsilon_0}\\left(-\\frac{Z}{r_1}-\\frac{Z}{r_2}+\\frac{1}{r_{12}}\\right)`})]}),`
`,(0,n.jsxs)(a.p,{children:[`The term in the middle is the mass polarization term. We further
introduced the reduced mass `,(0,n.jsx)(a.code,{className:`language-math math-inline`,children:`\\mu = \\frac{m_eM}{m_e + M}`}),` For the very
large mass differences `,(0,n.jsx)(a.code,{className:`language-math math-inline`,children:`M= 7300 m_e \\gg m_e`}),`, we can do two
simplifications:`]}),`
`,(0,n.jsxs)(a.ul,{children:[`
`,(0,n.jsxs)(a.li,{children:[`
`,(0,n.jsx)(a.p,{children:`Omit the term on the mass polarization.`}),`
`]}),`
`,(0,n.jsxs)(a.li,{children:[`
`,(0,n.jsx)(a.p,{children:`Set the reduced mass to the mass of the electron.`}),`
`]}),`
`]}),`
`,(0,n.jsxs)(a.p,{children:[`So we obtain the simplified Hamiltonian
`,(0,n.jsx)(a.code,{className:`language-math math-inline`,children:`H = -\\frac{\\hbar^2}{2m_e}\\nabla_{r_1}^2 -\\frac{\\hbar^2}{2m_e}\\nabla_{r_2}^2+\\frac{e^2}{4\\pi \\epsilon_0}\\left(-\\frac{Z}{r_1}-\\frac{Z}{r_2}+\\frac{1}{r_{12}}\\right)`})]}),`
`,(0,n.jsx)(a.h2,{children:`Natural units`}),`
`,(0,n.jsxs)(a.p,{children:[`For simplicity it is actually nice to work in the so-called `,(0,n.jsx)(a.strong,{children:`natural
units`}),`, where we measure all energies and distance on typical scales.
We will start out by measuring all distances in units of `,(0,n.jsx)(a.code,{className:`language-math math-inline`,children:`a_0`}),`, which is
defined as:
`,(0,n.jsx)(a.code,{className:`language-math math-inline`,children:`a_0 = \\frac{4\\pi \\epsilon_0 \\hbar^2}{me^2} = 0.5\\text{angstrom}`}),` So
we can introduce the replacement: `,(0,n.jsx)(a.code,{className:`language-math math-inline`,children:`\\mathbf{r} = \\mathbf{\\tilde{r}}a_0`}),`
So the Hamiltonian reads:`]}),`
`,(0,n.jsx)(a.pre,{children:(0,n.jsx)(a.code,{className:`language-math math-display`,children:`H = -\\frac{\\hbar^2}{2m_ea_0^2}\\nabla_{\\tilde{r}_1}^2 -\\frac{\\hbar^2}{2m_ea_0^2}\\nabla_{\\tilde{r}_2}^2+\\frac{e^2}{4\\pi \\epsilon_0 a_0}\\left(-\\frac{Z}{\\tilde{r}_1}-\\frac{Z}{\\tilde{r}_2}+\\frac{1}{\\tilde{r}_{12}}\\right)\\\\
H = -\\frac{e^4 m}{2(4\\pi\\epsilon_0)^2 \\hbar^2}\\nabla_{\\tilde{r}_1}^2 -\\frac{e^4 m}{2(4\\pi\\epsilon_0)^2 \\hbar^2}\\nabla_{\\tilde{r}_2}^2+\\frac{e^4 m}{(4\\pi \\epsilon_0)^2\\hbar^2}\\left(-\\frac{Z}{\\tilde{r}_1}-\\frac{Z}{\\tilde{r}_2}+\\frac{1}{\\tilde{r}_{12}}\\right)`})}),`
`,(0,n.jsxs)(a.p,{children:[`And finally we can measure all energies in units of
`,(0,n.jsx)(a.code,{className:`language-math math-inline`,children:`E_0 = \\frac{e^4 m}{(4\\pi\\epsilon_0)^2\\hbar^2} = 1\\text{hartree} = 27.2\\text{eV}`}),`
So the Hamiltonian reads in these natural units:`]}),`
`,(0,n.jsx)(a.pre,{children:(0,n.jsx)(a.code,{className:`language-math math-display`,children:`\\tilde{H} = -\\frac{1}{2}\\nabla_{\\tilde{r}_1}^2 -\\frac{1}{2}\\nabla_{\\tilde{r}_2}^2+\\left(-\\frac{Z}{\\tilde{r}_1}-\\frac{Z}{\\tilde{r}_2}+\\frac{1}{\\tilde{r}_{12}}\\right)`})}),`
`,(0,n.jsx)(a.p,{children:`Another, more common, way of introducing this is to define:`}),`
`,(0,n.jsx)(a.pre,{children:(0,n.jsx)(a.code,{className:`language-math math-display`,children:`m = \\hbar = e = 4\\pi \\epsilon_0 \\equiv 1\\\\
\\alpha = \\frac{e^2}{(4\\pi \\epsilon_0) \\hbar c}= \\frac{1}{137}\\\\
\\Rightarrow c = \\frac{1}{\\alpha}`})}),`
`,(0,n.jsxs)(a.p,{children:[`Within these units we have for the hydrogen atom:
`,(0,n.jsx)(a.code,{className:`language-math math-inline`,children:`E_n = \\frac{Z^2}{2}\\frac{1}{n^2}E_0`})]}),`
`,(0,n.jsx)(a.p,{children:(0,n.jsx)(a.strong,{children:`For the remainder of this lecture we will assume that we are working
in natural units and just omit the tildas.`})}),`
`,(0,n.jsx)(a.h2,{children:`Electron-electron interaction`}),`
`,(0,n.jsxs)(a.p,{children:[`Now we can decompose the Hamiltonian in the following fashion:
`,(0,n.jsx)(a.code,{className:`language-math math-inline`,children:`H = H_1 + H_2 + H_{12}`}),` So without the coupling term between the
electrons we would just have once again two hydrogen atoms. The whole
crux is now that the term `,(0,n.jsx)(a.code,{className:`language-math math-inline`,children:`H_{12}`}),` is actually coupling or
`,(0,n.jsx)(a.strong,{children:`entangling`}),` the two electrons.`]}),`
`,(0,n.jsx)(a.h2,{children:`Symmetries`}),`
`,(0,n.jsxs)(a.p,{children:[`The `,(0,n.jsx)(a.strong,{children:`exchange`}),` operator is defined as:`]}),`
`,(0,n.jsx)(a.pre,{children:(0,n.jsx)(a.code,{className:`language-math math-display`,children:`P_{12}\\psi(r_1,r_2) = \\psi(r_2, r_1)`})}),`
`,(0,n.jsxs)(a.p,{children:[`We directly see for the Hamiltonian of Helium in the reduced units that the exchange operator commutes with
the Hamiltonian, `,(0,n.jsx)(a.code,{className:`language-math math-inline`,children:`[H,P_{12}] = 0`}),`. This implies directly that the parity
is a conserved quantity of the system and that we have a set of
Eigenstates associated with the parity.`]}),`
`,(0,n.jsx)(a.p,{children:`We can now apply the operator twice:`}),`
`,(0,n.jsx)(a.pre,{children:(0,n.jsx)(a.code,{className:`language-math math-display`,children:`P_{12}^2\\psi(r_1,r_2) = \\lambda^2 \\psi(r_1, r_2) = \\psi(r_1, r_2)`})}),`
`,(0,n.jsxs)(a.p,{children:[`So we can see that there are two sets of eigenvalues with
`,(0,n.jsx)(a.code,{className:`language-math math-inline`,children:`\\lambda = \\pm 1`}),`.`]}),`
`,(0,n.jsx)(a.pre,{children:(0,n.jsx)(a.code,{className:`language-math math-display`,children:`P_{12}\\psi_\\pm = \\pm \\psi_\\pm`})}),`
`,(0,n.jsx)(a.p,{children:`We will call:`}),`
`,(0,n.jsxs)(a.ul,{children:[`
`,(0,n.jsxs)(a.li,{children:[`
`,(0,n.jsxs)(a.p,{children:[(0,n.jsx)(a.code,{className:`language-math math-inline`,children:`\\psi_+`}),` are para-states`]}),`
`]}),`
`,(0,n.jsxs)(a.li,{children:[`
`,(0,n.jsxs)(a.p,{children:[(0,n.jsx)(a.code,{className:`language-math math-inline`,children:`\\psi_-`}),` are ortho-states`]}),`
`]}),`
`]}),`
`,(0,n.jsxs)(a.p,{children:[`This symmetry is a really strong one and it was only recently that
direct transitions between `,(0,n.jsx)(a.a,{href:`http://dx.doi.org/10.1103/physrevlett.119.173401`,children:`ortho and para-states were observed`}),`. Interestingly, we did not need to look into the spin
and the Pauli principle for this discussion at all. This will happen in
the next step.`]}),`
`,(0,n.jsx)(a.h2,{children:`Spin and Pauli principle`}),`
`,(0,n.jsx)(a.p,{children:`We have seen that the Hamiltonian does not contain the spin degree of
freedom. So we can decompose the total wave function as:`}),`
`,(0,n.jsx)(a.pre,{children:(0,n.jsx)(a.code,{className:`language-math math-display`,children:`\\overline{\\psi} = \\psi(\\mathbf{r}_1, \\mathbf{r}_2) \\cdot \\chi(1,2)`})}),`
`,(0,n.jsx)(a.h3,{children:`Spin degree of freedom`}),`
`,(0,n.jsxs)(a.p,{children:[`Given that the electron is `,(0,n.jsx)(a.code,{className:`language-math math-inline`,children:`s=\\frac{1}{2}`}),`, we can decompose each
wavefunction as:
`,(0,n.jsx)(a.code,{className:`language-math math-inline`,children:`\\chi = \\alpha |\\uparrow\\rangle + \\beta |\\downarrow\\rangle`}),` So if the
two spins were `,(0,n.jsx)(a.em,{children:`not`}),` correlated, we could just write the spin
wavefunction as: `,(0,n.jsx)(a.code,{className:`language-math math-inline`,children:`\\chi(1,2) = \\chi_\\mathrm{1}\\cdot\\chi_\\mathrm{2}`}),`
However, the electron-electron interaction entangles the atoms. An
example would be the singlet state:
`,(0,n.jsx)(a.code,{className:`language-math math-inline`,children:`\\chi(1,2) = \\frac{1}{\\sqrt{2}}\\left(|\\uparrow \\downarrow\\rangle - |\\downarrow\\uparrow \\rangle\\right)`})]}),`
`,(0,n.jsxs)(a.p,{children:[`To construct the full wave function we need to take into account the
`,(0,n.jsx)(a.em,{children:`Pauli`}),` principle, which telles us for Fermions that the `,(0,n.jsx)(a.em,{children:`full`}),`
wavefunction should anti-sysmmetrc under exchange of particles:`]}),`
`,(0,n.jsx)(a.pre,{children:(0,n.jsx)(a.code,{className:`language-math math-display`,children:`\\overline{\\psi}(q_1, q_2, \\cdots, q_i,\\cdots,  q_j, \\cdots) =
-\\overline{\\psi}(q_1, q_2, \\cdots, q_j,\\cdots,  q_i, \\cdots)`})}),`
`,(0,n.jsx)(a.p,{children:`This tells us that each quantum state can be only occupied by a single
electron at maximum.`}),`
`,(0,n.jsx)(a.p,{children:`Now we can come back to the full wavefunction using the results of the
previous section. We have:`}),`
`,(0,n.jsx)(a.pre,{children:(0,n.jsx)(a.code,{className:`language-math math-display`,children:`\\overline{\\psi}(1,2) = \\psi_{\\pm}(r_1,r_2)\\chi_\\mp(1,2)`})}),`
`,(0,n.jsxs)(a.p,{children:[`with
`,(0,n.jsx)(a.code,{className:`language-math math-inline`,children:`P_{12}\\chi_\\pm = \\pm \\chi_\\pm`}),`. Now can once again look for good
solutions to this problem. It is basically the total spin
`,(0,n.jsx)(a.code,{className:`language-math math-inline`,children:`\\mathbf{S} = \\mathbf{S}_1 + \\mathbf{S}_2`}),`, or better `,(0,n.jsx)(a.code,{className:`language-math math-inline`,children:`\\mathbf{S}^2`}),`.
This commutes with both the Hamiltonian and the parity operator, so it
is a conserved quantity. Sorting out the solutions we have`]}),`
`,(0,n.jsx)(a.pre,{children:(0,n.jsx)(a.code,{className:`language-math math-display`,children:`
\\chi*- = \\frac{1}{\\sqrt{2}}\\left(|\\uparrow\\downarrow\\rangle - |\\downarrow\\uparrow\\rangle\\right)\\\\
\\chi*{+,1} = |\\uparrow\\uparrow\\rangle \\\\
\\chi*{+,1} = \\frac{1}{\\sqrt{2}}\\left(|\\uparrow\\downarrow\\rangle + |\\downarrow\\uparrow\\rangle\\right) \\\\
\\chi*{+,-1} = |\\downarrow\\downarrow\\rangle \\\\

`})}),`
`,(0,n.jsxs)(a.p,{children:[`So `,(0,n.jsx)(a.code,{className:`language-math math-inline`,children:`\\chi_+`}),` is associated with spin 1 and `,(0,n.jsx)(a.code,{className:`language-math math-inline`,children:`\\chi_-`}),` is
associated with spin 0.`]}),`
`,(0,n.jsxs)(a.section,{"data-footnotes":!0,className:`footnotes`,children:[(0,n.jsx)(a.h2,{className:`sr-only`,id:`footnote-label`,children:`Footnotes`}),`
`,(0,n.jsxs)(a.ol,{children:[`
`,(0,n.jsxs)(a.li,{id:`user-content-fn-1`,children:[`
`,(0,n.jsxs)(a.p,{children:[`It's proper derivation is left to quantum field theory lectures `,(0,n.jsx)(a.a,{href:`#user-content-fnref-1`,"data-footnote-backref":``,"aria-label":`Back to reference 1`,className:`data-footnote-backref`,children:`↩`})]}),`
`]}),`
`,(0,n.jsxs)(a.li,{id:`user-content-fn-2`,children:[`
`,(0,n.jsxs)(a.p,{children:[`It should be as there is no external torque acting on the atom `,(0,n.jsx)(a.a,{href:`#user-content-fnref-2`,"data-footnote-backref":``,"aria-label":`Back to reference 2`,className:`data-footnote-backref`,children:`↩`})]}),`
`]}),`
`,(0,n.jsxs)(a.li,{id:`user-content-fn-3`,children:[`
`,(0,n.jsxs)(a.p,{children:[`see lecture 2 for a few words on the definition of such a set `,(0,n.jsx)(a.a,{href:`#user-content-fnref-3`,"data-footnote-backref":``,"aria-label":`Back to reference 3`,className:`data-footnote-backref`,children:`↩`})]}),`
`]}),`
`,(0,n.jsxs)(a.li,{id:`user-content-fn-bransden`,children:[`
`,(0,n.jsxs)(a.p,{children:[`Brian Harold Bransden, Charles Jean Joachain. Physics of atoms and molecules. Pearson Education India, 2003. `,(0,n.jsx)(a.a,{href:`#user-content-fnref-bransden`,"data-footnote-backref":``,"aria-label":`Back to reference 4`,className:`data-footnote-backref`,children:`↩`})]}),`
`]}),`
`]}),`
`]})]})}function s(e={}){let{wrapper:t}=e.components||{};return t?(0,n.jsx)(t,{...e,children:(0,n.jsx)(o,{...e})}):o(e)}export{s as default,a as frontmatter};