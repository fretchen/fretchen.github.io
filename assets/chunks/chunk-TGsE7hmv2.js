import{t as e}from"./chunk-BLhQqvoO.js";import{t}from"./chunk-BcD_3RzP.js";var n=e(),r=`/assets/static/lecture7_pic1.CZiAUyTW.png`,i=`/assets/static/lecture7_pic2.Gr-HSnUJ.png`,a={author:[`fretchen`,`Selim Jochim`],order:7,title:`Lecture 7 - Beyond the 'boring' hydrogen atom`};function o(e){let a={a:`a`,code:`code`,em:`em`,h2:`h2`,h3:`h3`,h4:`h4`,li:`li`,ol:`ol`,p:`p`,pre:`pre`,strong:`strong`,ul:`ul`,...e.components};return(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)(a.p,{children:`In this lecture we will use the hydrogen atom to study static
perturbations in form of external magnetic fields and relativistic
effects, leading to the fine structure splitting.`}),`
`,(0,n.jsx)(a.p,{children:`We spend quite some time on the properties of the hydrogen atom in the
previous lectures [@Jendrzejewski; @atom]. However, we completely
neglected any effects of quantum-electrodynamics and relativistic
physics. In this lecture we will study, why this is a good approximation
for the hydrogen atom and then investigate in a perturbative fashion the
terms. Most importantly, we will introduce that coupling between the
orbital angular momentum and the spin of the electron, which leads to
the fine splitting.`}),`
`,(0,n.jsx)(a.h2,{children:`Perturbation theory`}),`
`,(0,n.jsx)(a.p,{children:`Up to now have studied the hydrogen atom to find its eigensystem and
then studied how it evolves under the presence of oscillating electric
fields. This allowed us to understand in more detail the idea of
eigenstates and then of time-dependent perturbation theory. However, one
of the most important concepts that can be introduced very nicely on the
hydrogen atom is stationnary perturbation theory in form of external
magnetic fields or relativistic corrections. We will remind you of
perturbation theory here and then apply it to some simple cases.`}),`
`,(0,n.jsx)(a.p,{children:`We can now simply write down the problem as:`}),`
`,(0,n.jsx)(a.pre,{children:(0,n.jsx)(a.code,{className:`language-math math-display`,children:`\\left(\\hat{H}_0+\\lambda \\hat{W}\\right)\\left|\\psi_m\\right\\rangle = E_m\\left|\\psi_m\\right\\rangle`})}),`
`,(0,n.jsxs)(a.p,{children:[(0,n.jsx)(a.code,{className:`language-math math-inline`,children:`\\lambda`}),` is a very small parameter and `,(0,n.jsx)(a.code,{className:`language-math math-inline`,children:`\\hat{H}_0`}),` is
describing the hydrogen atom system. We will note the eigenvalues and
eigenstates of this system as:`]}),`
`,(0,n.jsx)(a.pre,{children:(0,n.jsx)(a.code,{className:`language-math math-display`,children:`
\\hat{H}_0\\left|\\varphi_n\\right\\rangle = \\epsilon_n \\left|\\varphi_n\\right\\rangle`})}),`
`,(0,n.jsxs)(a.p,{children:[`While, we do not know the exact solution of
`,(0,n.jsx)(a.code,{className:`language-math math-inline`,children:`\\left|\\psi_m\\right\\rangle`}),` and the energy `,(0,n.jsx)(a.code,{className:`language-math math-inline`,children:`E_m`}),`, we decide
to decompose them in the following expansion of the small parameter
`,(0,n.jsx)(a.code,{className:`language-math math-inline`,children:`\\lambda`}),`:`]}),`
`,(0,n.jsx)(a.pre,{children:(0,n.jsx)(a.code,{className:`language-math math-display`,children:`\\left|\\psi_m\\right\\rangle = \\left|\\psi_m^{(0)}\\right\\rangle + \\lambda\\left|\\psi_m^{(1)}\\right\\rangle+\\lambda^2\\left|\\psi_m^{(2)}\\right\\rangle+O(\\lambda^3)\\\\
E_m = E_m^{(0)} +\\lambda E_m^{(1)} + \\lambda^2 E_m^{(2)}+O(\\lambda^3)\\,`})}),`
`,(0,n.jsxs)(a.p,{children:[`To zeroth order in `,(0,n.jsx)(a.code,{className:`language-math math-inline`,children:`\\lambda`}),` we obtain:`]}),`
`,(0,n.jsx)(a.pre,{children:(0,n.jsx)(a.code,{className:`language-math math-display`,children:`\\hat{H}_0\\left|\\psi_m^{(0)}\\right\\rangle = E_m^{(0)}\\left|\\psi_m^{(0)}\\right\\rangle`})}),`
`,(0,n.jsx)(a.p,{children:`So it is just the unperturbed system and we can
identify:`}),`
`,(0,n.jsx)(a.pre,{children:(0,n.jsx)(a.code,{className:`language-math math-display`,children:`\\left|\\psi_m^{(0)}\\right\\rangle = \\left|\\varphi_m\\right\\rangle~~E_m^{(0)} = \\epsilon_m`})}),`
`,(0,n.jsx)(a.p,{children:`For the first order we have to solve`}),`
`,(0,n.jsx)(a.pre,{children:(0,n.jsx)(a.code,{className:`language-math math-display`,children:`
(\\hat{H}_0-E_m^{(0)}) \\left|\\psi_m^{(1)}\\right\\rangle + (\\hat{W}-E_m^{(1)})\\left|\\psi_m^{(0)}\\right\\rangle= 0\\\\
(\\hat{H}_0-\\epsilon_m) \\left|\\psi_m^{(1)}\\right\\rangle + (\\hat{W}-E_m^{(1)})\\left|\\varphi_m\\right\\rangle= 0`})}),`
`,(0,n.jsxs)(a.p,{children:[`We can multiply the whole equation by
`,(0,n.jsx)(a.code,{className:`language-math math-inline`,children:`\\left\\langle\\varphi_m\\right|`}),` from the right. As
`,(0,n.jsx)(a.code,{className:`language-math math-inline`,children:`\\left\\langle\\varphi_m\\right|\\hat{H}_0= \\epsilon_m\\left\\langle\\varphi_m\\right|`}),`,
the first term cancels out. Hence, we obtain:`]}),`
`,(0,n.jsx)(a.pre,{children:(0,n.jsx)(a.code,{className:`language-math math-display`,children:`
\\boxed{E_m^{(1)} = \\left\\langle\\varphi_m\\right|\\hat{W}\\left|\\varphi_m\\right\\rangle}`})}),`
`,(0,n.jsx)(a.p,{children:`We now also need to obtain the correction to the
eigenstate. For that, we put the solution for the energy into the Ansatz to obain:`}),`
`,(0,n.jsx)(a.pre,{children:(0,n.jsx)(a.code,{className:`language-math math-display`,children:`(\\hat{H}_0-\\epsilon_m) \\left|\\psi_m^{(1)}\\right\\rangle + (\\hat{W}\\left|\\varphi_m\\right\\rangle-\\left|\\varphi_m\\right\\rangle\\left\\langle\\varphi_m\\right|\\hat{W}\\left|\\varphi_m\\right\\rangle)= 0`})}),`
`,(0,n.jsxs)(a.p,{children:[`We can now multiply the whole equation by
`,(0,n.jsx)(a.code,{className:`language-math math-inline`,children:`\\left\\langle\\varphi_i\\right|`}),` from the right and obtain:`]}),`
`,(0,n.jsx)(a.pre,{children:(0,n.jsx)(a.code,{className:`language-math math-display`,children:`(\\epsilon_i-\\epsilon_m)\\left\\langle\\varphi_i\\right|\\left|\\psi_m^{(1)}\\right\\rangle+\\left\\langle\\varphi_i\\right|\\hat{W}\\left|\\varphi_m\\right\\rangle = 0`})}),`
`,(0,n.jsxs)(a.p,{children:[`By rewriting the above equation, this directly gives us
the decompositon of the `,(0,n.jsx)(a.code,{className:`language-math math-inline`,children:`\\left|\\psi_m^{(1)}\\right\\rangle`}),`
onto the original eigenstates and have:`]}),`
`,(0,n.jsx)(a.pre,{children:(0,n.jsx)(a.code,{className:`language-math math-display`,children:`
\\boxed{\\left|\\psi_m^{(1)}\\right\\rangle = \\sum_{i\\neq m} \\frac{\\left\\langle\\varphi_i\\right|\\hat{W}\\left|\\varphi_m\\right\\rangle}{(\\epsilon_m-\\epsilon_i)}\\left|\\varphi_i\\right\\rangle}`})}),`
`,(0,n.jsxs)(a.p,{children:[`And we end the calculation with second order pertubation
in `,(0,n.jsx)(a.code,{className:`language-math math-inline`,children:`\\lambda`})]}),`
`,(0,n.jsx)(a.pre,{children:(0,n.jsx)(a.code,{className:`language-math math-display`,children:`(\\hat{H}_0-E_m^{(0)}) \\left|\\psi_m^{(2)}\\right\\rangle + (\\hat{W}-E_m^{(1)})\\left|\\psi_m^{(1)}\\right\\rangle-E_m^{(2)} \\left|\\psi_m^{(0)}\\right\\rangle= 0\\\\
(\\hat{H}_0-\\epsilon_m) \\left|\\psi_m^{(2)}\\right\\rangle + (\\hat{W}-E_m^{(1)})\\left|\\psi_m^{(1)}\\right\\rangle-E_m^{(2)} \\left|\\varphi_m\\right\\rangle= 0\\\\`})}),`
`,(0,n.jsxs)(a.p,{children:[`We can multiply once again whole equation by
`,(0,n.jsx)(a.code,{className:`language-math math-inline`,children:`\\left\\langle\\varphi_m\\right|`}),` from the right, which
directly drops the first term. The term
`,(0,n.jsx)(a.code,{className:`language-math math-inline`,children:`E_m^{(1)}\\left\\langle\\varphi_m\\right|\\left|\\psi_m^{(1)}\\right\\rangle`}),`
drops out as the first order perturbation does not contain a projection
onto the initial state. So we can write:`]}),`
`,(0,n.jsx)(a.pre,{children:(0,n.jsx)(a.code,{className:`language-math math-display`,children:`E_m^{(2)}= \\left\\langle\\varphi_m\\right|\\hat{W}\\left|\\psi_m^{(1)}\\right\\rangle`})}),`
`,(0,n.jsx)(a.p,{children:`Plugging in our solution, we obtain:`}),`
`,(0,n.jsx)(a.pre,{children:(0,n.jsx)(a.code,{className:`language-math math-display`,children:`\\boxed{E_m^{(2)} = \\sum_{i\\neq m} \\frac{|\\left\\langle\\varphi_i\\right|\\hat{W}\\left|\\varphi_m\\right\\rangle|^2}{(\\epsilon_m-\\epsilon_i)}}`})}),`
`,(0,n.jsx)(a.h2,{children:`Static external magnetic fields`}),`
`,(0,n.jsx)(a.p,{children:`A first beautiful application of perturbation theory is the study of
static magnetic fields (see Ch 1.9 and Ch. 2.7.1 of [@Hertel_2015] for
more details). The motion of the electron around the nucleus implies a
magnetic current`}),`
`,(0,n.jsx)(a.pre,{children:(0,n.jsx)(a.code,{className:`language-math math-display`,children:`I = \\frac{e}{t} = \\frac{ev}{2\\pi r}`})}),`
`,(0,n.jsxs)(a.p,{children:[`and this implies a magnetic moment `,(0,n.jsx)(a.code,{className:`language-math math-inline`,children:`M = I A`}),`, with the
enclosed surface `,(0,n.jsx)(a.code,{className:`language-math math-inline`,children:`A=\\pi r^2`}),`. It may be rewritten as:`]}),`
`,(0,n.jsx)(a.pre,{children:(0,n.jsx)(a.code,{className:`language-math math-display`,children:`\\vec{M}_L = -\\frac{e}{2m_e}\\vec{L} =-\\frac{\\mu_B}{\\hbar} \\vec{L} \\\\
\\mu_B = \\frac{\\hbar e}{2m_e}`})}),`
`,(0,n.jsxs)(a.p,{children:[`where `,(0,n.jsx)(a.code,{className:`language-math math-inline`,children:`\\mu_B`}),` is the `,(0,n.jsx)(a.strong,{children:`Bohr magneton`}),`. Its potential
energy in a magnetic field `,(0,n.jsx)(a.code,{className:`language-math math-inline`,children:`\\vec{B} = B_0 \\vec{e}_z`}),` is then:`]}),`
`,(0,n.jsx)(a.pre,{children:(0,n.jsx)(a.code,{className:`language-math math-display`,children:`V_B = -\\vec{M}_L\\cdot \\vec{B}\\\\
= \\frac{\\mu_B}{\\hbar} L_z B_0`})}),`
`,(0,n.jsx)(a.p,{children:`Its contribution is directly evaluated from the expression on first oder pertubation theory to be:`}),`
`,(0,n.jsx)(a.pre,{children:(0,n.jsx)(a.code,{className:`language-math math-display`,children:`E_{Zeeman} = \\mu_B m B_0`})}),`
`,(0,n.jsx)(a.p,{children:`This is the Zeeman splitting of the different magnetic
substates. It is visualized below`}),`
`,(0,n.jsx)(t,{id:`fig-zeeman-effect-hydrogen`,href:r,caption:`The Zeeman effect in the hydrogen atom`}),`
`,(0,n.jsx)(a.h2,{children:`Trapping with electric or magnetic fields`}),`
`,(0,n.jsx)(a.p,{children:`We have now investigated the structure of the hydrogen atom and seen how
its energy gets shifted in external magnetic fields. We can combine this
understanding to study conservative traps for atoms and ions. Neutral
atoms experience the external field:`}),`
`,(0,n.jsx)(a.pre,{children:(0,n.jsx)(a.code,{className:`language-math math-display`,children:`E_{mag}(x,y) = \\mu_B m B_0(x,y)`})}),`
`,(0,n.jsx)(a.p,{children:`For ions on the other hand we have fully charged
particles. So they simply experience the external electric field
directly:`}),`
`,(0,n.jsx)(a.pre,{children:(0,n.jsx)(a.code,{className:`language-math math-display`,children:`E_{el}(x,y) = -q E(x,y)`})}),`
`,(0,n.jsx)(a.p,{children:`Trapping atoms and ions has to be done under very good vacuum such that
they are well isolate from the enviromnent and high precision
experiments can be performed.`}),`
`,(0,n.jsxs)(a.p,{children:[`However, the trap construction is not trivial given Maxwells equation
`,(0,n.jsx)(a.code,{className:`language-math math-inline`,children:`\\text{div} \\vec{E} = 0`}),` and `,(0,n.jsx)(a.code,{className:`language-math math-inline`,children:`\\text{div} \\vec{B} = 0`}),`. So, the
experimentalists have to play some tricks with oscillating fields. We
will not derive in detail how a resulting `,(0,n.jsx)(a.strong,{children:`Paul trap`}),` works, but the
`,(0,n.jsx)(a.a,{href:`https://youtu.be/Xb-zpM0UOzk`,children:`linked video`}),` gives a very nice
impression of the idea behind it. A sketch is presented in Fig.`]}),`
`,(0,n.jsx)(t,{id:`fig-paul-trap-schematic`,href:i,caption:`Paul trap schematic and linear ion trap with calcium ions`}),`
`,(0,n.jsxs)(a.p,{children:[`This work on trapping ions dates back to the middle of the last century
(!!!) and was recognized by the`,(0,n.jsx)(a.a,{href:`https://www.nobelprize.org/prizes/physics/1989/summary/`,children:` Nobel prize in
1989`}),` for
`,(0,n.jsx)(a.a,{href:`http://dx.doi.org/10.1103/revmodphys.62.531`,children:`Wolfgang Paul`}),` and`,(0,n.jsx)(a.a,{href:`http://dx.doi.org/10.1103/revmodphys.62.525`,children:`Hans Dehmelt`}),`. They shared
the prize with Norman Ramsey, who developped extremely precise
spectroscopic methods, now known `,(0,n.jsx)(a.a,{href:`http://dx.doi.org/10.1103/revmodphys.62.541`,children:`as Ramsey spectroscopy`}),`.`]}),`
`,(0,n.jsxs)(a.p,{children:[`For atoms we can play similiar games with magnetic traps. Again we have
to solve the problem of the zero magnetic fields. Widely used
configurations are the Ioffe-Pritchard trap, where quadrupole fields are
superposed `,(0,n.jsx)(a.a,{href:`http://dx.doi.org/10.1103/physrevlett.51.1336`,children:`with a bias field`}),`, or `,(0,n.jsx)(a.a,{href:`http://dx.doi.org/10.1103/physrevlett.74.3352`,children:`TOP-traps`}),`.`]}),`
`,(0,n.jsx)(a.p,{children:`Ion traps are now the basis of ionic quantum computers and
magnetic traps paved the way for quantum simulators with cold atoms as will see later on.`}),`
`,(0,n.jsx)(a.h3,{children:`What we missed from the Dirac equation`}),`
`,(0,n.jsx)(a.p,{children:`Until now we have completely neglected relativistic effects, i.e. we
should have really solved the Dirac equation instead of the Schrödinger
equation. However, this is is major task, which we will not undertake
here. But what were the main approximations ?`}),`
`,(0,n.jsxs)(a.ol,{children:[`
`,(0,n.jsxs)(a.li,{children:[`
`,(0,n.jsx)(a.p,{children:`We neglected the existance of the electron spin.`}),`
`]}),`
`,(0,n.jsxs)(a.li,{children:[`
`,(0,n.jsx)(a.p,{children:`We did not take into account the relativistic effects.`}),`
`]}),`
`]}),`
`,(0,n.jsx)(a.p,{children:`So, how does relativity affect the hydrogen spectrum? In a first step,
we should actually introduce the magnetic moment of the spin:`}),`
`,(0,n.jsx)(a.pre,{children:(0,n.jsx)(a.code,{className:`language-math math-display`,children:`\\vec{M}_S = -g_e \\mu_B \\frac{\\vec{S}}{\\hbar}`})}),`
`,(0,n.jsxs)(a.p,{children:[`The spin of the electron is `,(0,n.jsx)(a.code,{className:`language-math math-inline`,children:`1/2`}),`, making it a fermion
and the `,(0,n.jsx)(a.em,{children:`g factor of the electron`}),` reads`]}),`
`,(0,n.jsx)(a.pre,{children:(0,n.jsx)(a.code,{className:`language-math math-display`,children:`g_e \\approx 2.0023`})}),`
`,(0,n.jsxs)(a.p,{children:[`Further discussions of the g-factor might be found in
`,(0,n.jsx)(a.a,{href:`http://dx.doi.org/10.1007/978-3-642-54322-7`,children:`Chapter 6.6 of Hertel`}),`.`]}),`
`,(0,n.jsx)(a.h4,{children:`Amplitude of the relativistic effects`}),`
`,(0,n.jsx)(a.p,{children:`We saw in the previous lectures, that the
energy levels of hydrogenlike atoms are given by:`}),`
`,(0,n.jsx)(a.pre,{children:(0,n.jsx)(a.code,{className:`language-math math-display`,children:`
E_n = \\frac{Z^2 R_{y,\\infty}}{n^2}\\\\
R_{y,\\infty} = \\frac{m_e e^4}{32 \\pi^2 \\epsilon_0^2 \\hbar^2}`})}),`
`,(0,n.jsx)(a.p,{children:`We can now use the fine-structure constant, which
measures the coupling strength of the electric charges to the
electromagnetic field:`}),`
`,(0,n.jsx)(a.pre,{children:(0,n.jsx)(a.code,{className:`language-math math-display`,children:`
\\alpha = \\frac{e^2}{4\\pi\\epsilon_0\\hbar c}\\\\
= \\frac{1}{137.035999139(31)}`})}),`
`,(0,n.jsx)(a.p,{children:`We can now rewrite the energies of the hydrogen atom as:`}),`
`,(0,n.jsx)(a.pre,{children:(0,n.jsx)(a.code,{className:`language-math math-display`,children:`E_n = \\frac{1}{2} \\underbrace{m_e c^2}_{\\text{rest mass energy}} Z^2 \\alpha^2 \\frac{1}{n^2}`})}),`
`,(0,n.jsxs)(a.p,{children:[`Here, `,(0,n.jsx)(a.code,{className:`language-math math-inline`,children:`m_e c^2\\approx 511\\textrm{k eV}`}),` is the rest
mass energy of the electron. `,(0,n.jsx)(a.code,{className:`language-math math-inline`,children:`E_n \\approx 10\\text{eV}`}),` on the other hand
is the energy of the bound state and therefore in the order of the
kinetic energy of the electron. As long as it is much smaller than the
rest-mass of the electron, we can neglect the relativistic effects. A
few observations:`]}),`
`,(0,n.jsxs)(a.ul,{children:[`
`,(0,n.jsxs)(a.li,{children:[`
`,(0,n.jsxs)(a.p,{children:[`Relativistic effects are most pronounced for deeply bound states of
small quantum number `,(0,n.jsx)(a.code,{className:`language-math math-inline`,children:`n`}),`.`]}),`
`]}),`
`,(0,n.jsxs)(a.li,{children:[`
`,(0,n.jsxs)(a.p,{children:[`Relativistic effects effects will become important once
`,(0,n.jsx)(a.code,{className:`language-math math-inline`,children:`(Z\\alpha)\\approx 1`}),`, so they will play a major role in heavy
nuclei.`]}),`
`]}),`
`]}),`
`,(0,n.jsx)(a.p,{children:`For the hydrogen atom we can thus treat the relativistic effects in a
perturbative approach.But the most important consequence of the
relativistic terms is actually the existance of the electron spin.`}),`
`,(0,n.jsx)(a.h3,{children:`The relativistic mass and Darwin term`}),`
`,(0,n.jsxs)(a.ol,{children:[`
`,(0,n.jsx)(a.li,{children:`"Relativistic mass": The relativistic relation between energy and
momentum reads:`}),`
`]}),`
`,(0,n.jsx)(a.pre,{children:(0,n.jsx)(a.code,{className:`language-math math-display`,children:`    E_\\text{rel} = \\sqrt{(mc^2)^2+(\\vec{p}c)^2}\\\\
    \\approx mc^2 + \\frac{p^2}{2m}- \\frac{\\vec{p}^{\\,4}}{8m^3c^2} + \\cdots`})}),`
`,(0,n.jsx)(a.p,{children:`The first two terms of the expansion are the
nonrelativistic limit and the third term is the first correction.
Therefore, the corresponding Hamiltonian is:`}),`
`,(0,n.jsx)(a.pre,{children:(0,n.jsx)(a.code,{className:`language-math math-display`,children:`    \\hat{H}_\\text{rm} = - \\frac{\\hat{\\vec{p}}^{\\,4}}{8m^3c^2}.`})}),`
`,(0,n.jsxs)(a.ol,{start:`2`,children:[`
`,(0,n.jsxs)(a.li,{children:[`Darwin term: If `,(0,n.jsx)(a.code,{className:`language-math math-inline`,children:`r=0`}),`, the potential `,(0,n.jsx)(a.code,{className:`language-math math-inline`,children:`V(r)`}),` diverges to `,(0,n.jsx)(a.code,{className:`language-math math-inline`,children:`-\\infty`}),`.
We get:`]}),`
`]}),`
`,(0,n.jsx)(a.pre,{children:(0,n.jsx)(a.code,{className:`language-math math-display`,children:`    \\hat{H}_\\text{Darwin} = \\frac{\\pi \\hbar^2}{2m^2c^2}\\left( \\frac{Ze^2}{4\\pi\\epsilon_0}\\right) \\delta(\\hat{\\vec{r}})`})}),`
`,(0,n.jsxs)(a.p,{children:[`If we perform a first correction to the energy of the eigenstates
`,(0,n.jsx)(a.code,{className:`language-math math-inline`,children:`\\left\\langle n,l,m\\right\\rangle`}),` by calculating`]}),`
`,(0,n.jsx)(a.pre,{children:(0,n.jsx)(a.code,{className:`language-math math-display`,children:`\\left\\langle n,l,m|\\hat{H'|n,l,m}\\right\\rangle,`})}),`
`,(0,n.jsxs)(a.p,{children:[`we find that it works perfectly for case (1) and (2)
which is due to degeneracy. `,(0,n.jsx)(a.code,{className:`language-math math-inline`,children:`\\hat{H}_\\text{rm}`}),` and
`,(0,n.jsx)(a.code,{className:`language-math math-inline`,children:`\\hat{H}_\\text{Darwin}`}),` commute with all observables forming the
complete set of commuting observables (CSCO) for `,(0,n.jsx)(a.code,{className:`language-math math-inline`,children:`\\hat{H}_0`})]}),`
`,(0,n.jsx)(a.pre,{children:(0,n.jsx)(a.code,{className:`language-math math-display`,children:`\\hat{H}_0,\\hat{\\vec{L}}^2, \\hat{L}_z,`})}),`
`,(0,n.jsxs)(a.p,{children:[`with states described by `,(0,n.jsx)(a.code,{className:`language-math math-inline`,children:`\\left|n,l,m\\right\\rangle`}),`.`]})]})}function s(e={}){let{wrapper:t}=e.components||{};return t?(0,n.jsx)(t,{...e,children:(0,n.jsx)(o,{...e})}):o(e)}export{s as default,a as frontmatter};