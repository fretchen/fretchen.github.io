import{Cn as e}from"./chunk-YPwviyFJ.js";import{t}from"./chunk-BNReSP_g2.js";var n=e(),r=`/assets/static/lecture4_pic1.DszrhizS.png`,i=`/assets/static/lecture4_pic2.CVTS08Q5.png`,a=`/assets/static/lecture4_pic3.DM5kykrW.png`,o={author:[`fretchen`,`Selim Jochim`],order:4,title:`Lecture 4 - Atoms in oscillating fields`};function s(e){let o={a:`a`,code:`code`,em:`em`,h2:`h2`,h3:`h3`,li:`li`,ol:`ol`,p:`p`,pre:`pre`,section:`section`,strong:`strong`,sup:`sup`,ul:`ul`,...e.components};return(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)(o.p,{children:`In the lecture, we will see how a time dependent coupling allows us to
engineer a new Hamiltonian. Most importantly, we will discuss the
resonant coupling of two levels and the decay of a single level to a
continuum.`}),`
`,(0,n.jsx)(o.p,{children:`In the last lecture, we discussed the properties of two
coupled levels. However, we did not elaborate at any stage how such a
system might emerge in a true atom. Two fundamental questions come to
mind:`}),`
`,(0,n.jsxs)(o.ol,{children:[`
`,(0,n.jsxs)(o.li,{children:[`
`,(0,n.jsx)(o.p,{children:`How is it that a laser allows to treat two atomic levels of very
different energies as if they were degenerate ?`}),`
`]}),`
`,(0,n.jsxs)(o.li,{children:[`
`,(0,n.jsxs)(o.p,{children:[`An atom has many energy levels `,(0,n.jsx)(o.code,{className:`language-math math-inline`,children:`E_n`}),` and most of them are not
degenerate. How can we reduce this complicated structure to a
two-level system?`]}),`
`]}),`
`]}),`
`,(0,n.jsxs)(o.p,{children:[`The solution is to resonantly couple two of the atom's levels by
applying an external, oscillatory field, which is very nicely discussed
in chapter 12 of Ref. `,(0,n.jsx)(o.sup,{children:(0,n.jsx)(o.a,{href:`#user-content-fn-2002`,id:`user-content-fnref-2002`,"data-footnote-ref":!0,"aria-describedby":`footnote-label`,children:`1`})}),` `,(0,n.jsx)(o.sup,{children:(0,n.jsx)(o.a,{href:`#user-content-fn-cohen_tannoudji_1998`,id:`user-content-fnref-cohen_tannoudji_1998`,"data-footnote-ref":!0,"aria-describedby":`footnote-label`,children:`2`})}),`. We will discuss
important and fundamental properties of systems with a time-dependent
Hamiltonian.`]}),`
`,(0,n.jsx)(o.p,{children:`We will discuss a simple model for the atom in the oscillatory field. We
can write down the Hamiltonian:`}),`
`,(0,n.jsx)(o.pre,{children:(0,n.jsx)(o.code,{className:`language-math math-display`,children:` \\hat{H} = \\hat{H}_0 + \\hat{V}(t).`})}),`
`,(0,n.jsxs)(o.p,{children:[`Here, `,(0,n.jsx)(o.code,{className:`language-math math-inline`,children:`\\hat{H}_0`}),` belongs to the atom and `,(0,n.jsx)(o.code,{className:`language-math math-inline`,children:`V(t)`}),`
describes the time-dependent field and its interaction with the atom. We
assume that `,(0,n.jsx)(o.code,{className:`language-math math-inline`,children:`\\left|n\\right\\rangle`}),` is an eigenstate of
`,(0,n.jsx)(o.code,{className:`language-math math-inline`,children:`\\hat{H}_0`}),` and write:`]}),`
`,(0,n.jsx)(o.pre,{children:(0,n.jsx)(o.code,{className:`language-math math-display`,children:`\\hat{H}_0\\left|n\\right\\rangle = E_n \\left|n\\right\\rangle.`})}),`
`,(0,n.jsxs)(o.p,{children:[`If the system is initially prepared in the state
`,(0,n.jsx)(o.code,{className:`language-math math-inline`,children:`\\left|i\\right\\rangle`}),`, so that`]}),`
`,(0,n.jsx)(o.pre,{children:(0,n.jsx)(o.code,{className:`language-math math-display`,children:`\\left|\\psi(t=0)\\right\\rangle = \\left|i\\right\\rangle,`})}),`
`,(0,n.jsx)(o.p,{children:`what is the probability`}),`
`,(0,n.jsx)(o.pre,{children:(0,n.jsx)(o.code,{className:`language-math math-display`,children:`P_m(t) = \\left|\\left\\langle m|\\psi(t)\\right\\rangle\\right|^2`})}),`
`,(0,n.jsxs)(o.p,{children:[`to find the system in the state
`,(0,n.jsx)(o.code,{className:`language-math math-inline`,children:`\\left|m\\right\\rangle`}),` at the time `,(0,n.jsx)(o.code,{className:`language-math math-inline`,children:`t`}),`?`]}),`
`,(0,n.jsx)(o.h2,{children:`Evolution Equation`}),`
`,(0,n.jsxs)(o.p,{children:[`The system `,(0,n.jsx)(o.code,{className:`language-math math-inline`,children:`\\left|\\psi(t)\\right\\rangle`}),` can be expressed as
follows:`]}),`
`,(0,n.jsx)(o.pre,{children:(0,n.jsx)(o.code,{className:`language-math math-display`,children:`\\left|\\psi(t)\\right\\rangle = \\sum_n \\gamma_n(t) \\mathrm{e}^{-i{E_n}t/{\\hbar}} \\left|n\\right\\rangle,`})}),`
`,(0,n.jsxs)(o.p,{children:[`where the exponential is the time evolution for
`,(0,n.jsx)(o.code,{className:`language-math math-inline`,children:`\\hat{H}_1 =~0`}),`. We plug this equation in the Schrödinger equation and
get:`]}),`
`,(0,n.jsx)(o.pre,{children:(0,n.jsx)(o.code,{className:`language-math math-display`,children:`i\\hbar \\sum_n\\left(\\dot{\\gamma}_n(t)-i\\frac{E_n}{\\hbar}\\gamma_n(t)\\right)\\mathrm{e}^{-i{E_n}t/{\\hbar}}\\left|n\\right\\rangle = \\sum_n \\gamma_n(t) \\mathrm{e}^{-i{E_n}t/{\\hbar}}\\left(\\hat{H}_0 + \\hat{V}\\right) \\left|n\\right\\rangle\\\\
\\Longleftrightarrow i\\hbar\\sum_n \\dot{\\gamma}_n(t) \\mathrm{e}^{-i{E_n}t/{\\hbar}} \\left|n\\right\\rangle
 = \\sum_n \\gamma_n(t) \\mathrm{e}^{-i{E_n}t/{\\hbar}} \\hat{V} \\left|n\\right\\rangle`})}),`
`,(0,n.jsxs)(o.p,{children:[`If we multiply the equation with `,(0,n.jsx)(o.code,{className:`language-math math-inline`,children:`\\left\\langle k\\right|`}),` we
obtain a set of coupled differential equations`]}),`
`,(0,n.jsx)(o.pre,{children:(0,n.jsx)(o.code,{className:`language-math math-display`,children:`i\\hbar \\dot{\\gamma}_k \\mathrm{e}^{-i{E_k}t/{\\hbar}} = \\sum_n \\gamma_n \\mathrm{e}^{-{E_n}t/{\\hbar}}\\left\\langle k\\right|\\hat{V}\\left|n\\right\\rangle,\\\\
i\\hbar \\dot{\\gamma}_k = \\sum_n \\gamma_n \\mathrm{e}^{-i {(E_n-E_k)}t/{\\hbar}} \\left\\langle k\\right| \\hat{V}\\left|n\\right\\rangle`})}),`
`,(0,n.jsxs)(o.p,{children:[`with initial conditions
`,(0,n.jsx)(o.code,{className:`language-math math-inline`,children:`\\left|\\psi(t=0)\\right\\rangle`}),`. They determine the full
time evolution.`]}),`
`,(0,n.jsx)(o.p,{children:`The solution of this set of equations depends on the details of the
system. However, there are a few important points:`}),`
`,(0,n.jsxs)(o.ul,{children:[`
`,(0,n.jsxs)(o.li,{children:[`
`,(0,n.jsxs)(o.p,{children:[`For short enough times, the dynamics are driving by the coupling
strength
`,(0,n.jsx)(o.code,{className:`language-math math-inline`,children:`\\left\\langle k\\right|\\hat{V} \\left|n\\right\\rangle`}),`.`]}),`
`]}),`
`,(0,n.jsxs)(o.li,{children:[`
`,(0,n.jsxs)(o.p,{children:[`The right-hand sight will oscillate on time scales of `,(0,n.jsx)(o.code,{className:`language-math math-inline`,children:`E_n-E_k`}),` and
typically average to zero for long times.`]}),`
`]}),`
`,(0,n.jsxs)(o.li,{children:[`
`,(0,n.jsxs)(o.p,{children:[`If the coupling element is an oscillating field
`,(0,n.jsx)(o.code,{className:`language-math math-inline`,children:`\\propto e^{i\\omega_L t}`}),`, it might put certain times on resonance
and allow us to avoid the averaging effect. It is exactly this
effect, which allows us to isolate specific transitions to a very
high degree `,(0,n.jsx)(o.sup,{children:(0,n.jsx)(o.a,{href:`#user-content-fn-1`,id:`user-content-fnref-1`,"data-footnote-ref":!0,"aria-describedby":`footnote-label`,children:`3`})})]}),`
`]}),`
`]}),`
`,(0,n.jsx)(o.p,{children:`We will now see how the two-state system emerges from these
approximations and then set-up the perturbative treatment step-by-step.`}),`
`,(0,n.jsx)(o.h2,{children:`Rotating wave approximation`}),`
`,(0,n.jsxs)(o.p,{children:[`We will now assume that the coupling term in indeed an oscillating field
with frequency `,(0,n.jsx)(o.code,{className:`language-math math-inline`,children:`\\omega_L`}),`, so it reads:`]}),`
`,(0,n.jsx)(o.pre,{children:(0,n.jsx)(o.code,{className:`language-math math-display`,children:`\\hat{V} = \\hat{V}_0 \\cos(\\omega_Lt) = \\frac{\\hat{V}_0}{2} \\left(e^{i\\omega_lt}+e^{-i\\omega_lt}\\right)`})}),`
`,(0,n.jsxs)(o.p,{children:[`We will further assume the we would like use it to
isolate the transition `,(0,n.jsx)(o.code,{className:`language-math math-inline`,children:`i\\rightarrow f`}),`, which is of frequency
`,(0,n.jsx)(o.code,{className:`language-math math-inline`,children:`\\hbar \\omega_0 = E_f - E_i`}),`. The relevant quantity is then the detuning
`,(0,n.jsx)(o.code,{className:`language-math math-inline`,children:`\\delta = \\omega_0 - \\omega_L`}),`. If it is much smaller than any other
energy difference `,(0,n.jsx)(o.code,{className:`language-math math-inline`,children:`E_n-E_i`}),`, we directly reduce the system to the
following closed system:`]}),`
`,(0,n.jsx)(o.pre,{children:(0,n.jsx)(o.code,{className:`language-math math-display`,children:`i\\dot{\\gamma}_i = \\gamma_f \\mathrm{e}^{-i \\delta t} \\Omega\\\\
i\\dot{\\gamma}_f = \\gamma_i \\mathrm{e}^{i \\delta t}\\Omega^*`})}),`
`,(0,n.jsxs)(o.p,{children:[`Here we defined
`,(0,n.jsx)(o.code,{className:`language-math math-inline`,children:`\\Omega = \\left\\langle i\\right| \\frac{\\hat{V_0}}{2\\hbar}\\left|f\\right\\rangle`}),`.
And to make it really a time-of the same form as the two-level system
from the last lecture, we perform the transformation
`,(0,n.jsx)(o.code,{className:`language-math math-inline`,children:`\\gamma_f = \\tilde{\\gamma}_f e^{i\\delta t}`}),`, which reduces the system
too:`]}),`
`,(0,n.jsx)(o.pre,{children:(0,n.jsx)(o.code,{className:`language-math math-display`,children:`i \\dot{\\gamma}_i = \\Omega \\tilde{\\gamma}_f \\\\
i\\dot{\\tilde{\\gamma}}_f = \\delta \\tilde{\\gamma}_f + \\Omega^* \\gamma_i`})}),`
`,(0,n.jsx)(o.p,{children:`This has exactly the form of the two-level system that
we studied previously.`}),`
`,(0,n.jsx)(o.h3,{children:`Adiabatic elimination`}),`
`,(0,n.jsxs)(o.p,{children:[`We can now proceed to the quite important case of far detuning, where
`,(0,n.jsx)(o.code,{className:`language-math math-inline`,children:`\\delta \\gg \\Omega`}),`. In this case, the final state
`,(0,n.jsx)(o.code,{className:`language-math math-inline`,children:`\\left|f\\right\\rangle`}),` gets barely populated and the time
evolution can be approximated to to be zero [@lukin].`]}),`
`,(0,n.jsx)(o.pre,{children:(0,n.jsx)(o.code,{className:`language-math math-display`,children:`\\dot{\\tilde{\\gamma}}_f = 0`})}),`
`,(0,n.jsxs)(o.p,{children:[`We can use this equation to eliminate `,(0,n.jsx)(o.code,{className:`language-math math-inline`,children:`\\gamma`}),` from the
time evolution of the ground state. This approximation is known as
`,(0,n.jsx)(o.em,{children:`adiabatic elimination`}),`:`]}),`
`,(0,n.jsx)(o.pre,{children:(0,n.jsx)(o.code,{className:`language-math math-display`,children:`\\tilde{\\gamma}_f = \\frac{\\Omega^*}{\\delta}\\gamma_i\\\\
\\Rightarrow i\\hbar \\dot{\\gamma}_i = \\frac{|\\Omega|^2}{\\delta} \\tilde{\\gamma}_i`})}),`
`,(0,n.jsxs)(o.p,{children:[`The last equation described the evolution of the initial
state with an energy `,(0,n.jsx)(o.code,{className:`language-math math-inline`,children:`E_i = \\frac{|\\Omega|^2}{\\delta}`}),`. If the Rabi
coupling is created through an oscillating electric field, i.e. a laser,
this is know as the `,(0,n.jsx)(o.strong,{children:`light shift`}),` or the `,(0,n.jsx)(o.strong,{children:`optical dipole potential`}),`.
It is this concept that underlies the optical tweezer for which Arthur
Ashkin got the `,(0,n.jsx)(o.a,{href:`https://www.nobelprize.org/uploads/2018/10/advanced-physicsprize2018.pdf`,children:`nobel prize in the 2018`}),`.`]}),`
`,(0,n.jsx)(o.h3,{children:`Example: Atomic clocks in optical tweezers`}),`
`,(0,n.jsxs)(o.p,{children:[`A neat example that ties the previous concepts together is `,(0,n.jsx)(o.a,{href:`https://arxiv.org/abs/1908.05619v2`,children:`the recent
paper`}),`. The experimental setup is visualized in the figure below.`]}),`
`,(0,n.jsx)(t,{id:`fig-atomic-clocks-tweezers`,href:r,caption:`Experimental setup for atomic clocks in optical tweezers`}),`
`,(0,n.jsxs)(o.p,{children:[`While nice examples these clocks are still far away from the best clocks
out there, which are based on `,(0,n.jsx)(o.a,{href:`http://dx.doi.org/10.1103/revmodphys.87.637`,children:`optical lattice clocks and ions`}),`.`]}),`
`,(0,n.jsx)(o.h2,{children:`Perturbative Solution`}),`
`,(0,n.jsx)(o.p,{children:`The more formal student might wonder at which points all these rather
hefty approximation are actually valid, which is obviously a very
substantial question. So, we will now try to isolate the most important
contributions to the complicated system through perturbation theory. For
that we will assume that we can write:`}),`
`,(0,n.jsx)(o.pre,{children:(0,n.jsx)(o.code,{className:`language-math math-display`,children:`\\hat{V}(t) =\\lambda \\hat{H}_1(t)`})}),`
`,(0,n.jsxs)(o.p,{children:[`, where `,(0,n.jsx)(o.code,{className:`language-math math-inline`,children:`\\lambda`}),` is a small parameter. In other words
we assume that the initial system `,(0,n.jsx)(o.code,{className:`language-math math-inline`,children:`\\hat{H}_0`}),` is only weakly perturbed.
Having identified the small parameter `,(0,n.jsx)(o.code,{className:`language-math math-inline`,children:`\\lambda`}),`, we make the
`,(0,n.jsx)(o.em,{children:`perturbative ansatz`})]}),`
`,(0,n.jsx)(o.pre,{children:(0,n.jsx)(o.code,{className:`language-math math-display`,children:`    \\gamma_n(t) = \\gamma_n^{(0)} + \\lambda \\gamma_n^{(1)} + \\lambda^2 \\gamma_n^{(2)} + \\cdots`})}),`
`,(0,n.jsxs)(o.p,{children:[`and plug this ansatz in the evolution equations and sort
them by terms of equal power in `,(0,n.jsx)(o.code,{className:`language-math math-inline`,children:`\\lambda`}),`.`]}),`
`,(0,n.jsxs)(o.p,{children:[`The `,(0,n.jsx)(o.code,{className:`language-math math-inline`,children:`0`}),`th order reads`]}),`
`,(0,n.jsx)(o.pre,{children:(0,n.jsx)(o.code,{className:`language-math math-display`,children:` i\\hbar \\dot{\\gamma}_k^{(0)} = 0.`})}),`
`,(0,n.jsxs)(o.p,{children:[`The `,(0,n.jsx)(o.code,{className:`language-math math-inline`,children:`0`}),`th order does not have a time evolution since we
prepared it in an eigenstate of `,(0,n.jsx)(o.code,{className:`language-math math-inline`,children:`\\hat{H}_0`}),`. Any evolution arises due
the coupling, which is at least of order `,(0,n.jsx)(o.code,{className:`language-math math-inline`,children:`\\lambda`}),`.`]}),`
`,(0,n.jsxs)(o.p,{children:[`So, for the `,(0,n.jsx)(o.code,{className:`language-math math-inline`,children:`1`}),`st order we get`]}),`
`,(0,n.jsx)(o.pre,{children:(0,n.jsx)(o.code,{className:`language-math math-display`,children:`
i\\hbar \\dot{\\gamma}_k^{(1)} = \\sum_n \\gamma_n^{(0)} \\mathrm{e}^{-i(E_n-E_k)t/{\\hbar}}\\left\\langle k\\right|\\hat{H}_1\\left|n\\right\\rangle.`})}),`
`,(0,n.jsx)(o.h3,{children:`First Order Solution (Born Approximation)`}),`
`,(0,n.jsxs)(o.p,{children:[`For the initial conditions `,(0,n.jsx)(o.code,{className:`language-math math-inline`,children:`\\psi(t=0)=\\left|i\\right\\rangle`}),`
we get`]}),`
`,(0,n.jsx)(o.pre,{children:(0,n.jsx)(o.code,{className:`language-math math-display`,children:`\\gamma_k^{(0)}(t) = \\delta_{ik}.`})}),`
`,(0,n.jsxs)(o.p,{children:[`We plug this in the `,(0,n.jsx)(o.code,{className:`language-math math-inline`,children:`1`}),`st order approximation and obtain the rate for the system to go
to the final state `,(0,n.jsx)(o.code,{className:`language-math math-inline`,children:`\\left|f\\right\\rangle`}),`:`]}),`
`,(0,n.jsx)(o.pre,{children:(0,n.jsx)(o.code,{className:`language-math math-display`,children:`i \\hbar\\dot{\\gamma}^{(1)} = \\mathrm{e}^{i(E_f-E_i)t/{\\hbar}} \\left\\langle f\\right|\\hat{H}_1 \\left|i\\right\\rangle`})}),`
`,(0,n.jsxs)(o.p,{children:[`Integration with `,(0,n.jsx)(o.code,{className:`language-math math-inline`,children:`\\gamma_f^{(1)}(t=0) = 0`}),` yields`]}),`
`,(0,n.jsx)(o.pre,{children:(0,n.jsx)(o.code,{className:`language-math math-display`,children:`
\\gamma_f^{(1)} = \\frac{1}{i\\hbar}\\int\\limits_0^t \\mathrm{e}^{i(E_f-E_i)t'/{\\hbar}} \\left\\langle f\\right| \\hat{H}_1(t')\\left|i\\right\\rangle \\mathop{}\\!\\mathrm{d}t',`})}),`
`,(0,n.jsx)(o.p,{children:`so that we obtain the probability for ending up in the
final state:`}),`
`,(0,n.jsx)(o.pre,{children:(0,n.jsx)(o.code,{className:`language-math math-display`,children:`P_{i\\to f}(t) = \\lambda^2\\left| \\gamma_f^{(1)}(t)\\right|^2.`})}),`
`,(0,n.jsxs)(o.p,{children:[`Note that `,(0,n.jsx)(o.code,{className:`language-math math-inline`,children:`P_{i\\to f}(t) \\ll 1`}),` is the condition for
this approximation to be valid!`]}),`
`,(0,n.jsx)(o.p,{children:(0,n.jsx)(o.strong,{children:`Example 1: Constant Perturbation.`})}),`
`,(0,n.jsx)(t,{id:`fig-constant-perturbation`,href:i,caption:`Sketch of a constant perturbation`}),`
`,(0,n.jsxs)(o.p,{children:[`We apply a constant perturbation in the time interval
`,(0,n.jsx)(o.code,{className:`language-math math-inline`,children:`\\left[0,T\\right]`}),`, as shown in above. If we use the expression for `,(0,n.jsx)(o.code,{className:`language-math math-inline`,children:`\\gamma_f^{(1)}`}),` and set `,(0,n.jsx)(o.code,{className:`language-math math-inline`,children:`\\hbar \\omega_0 = E_f-E_i`}),`, we get`]}),`
`,(0,n.jsx)(o.pre,{children:(0,n.jsx)(o.code,{className:`language-math math-display`,children:`\\gamma_f^{(1)}(t\\geq T) = \\frac{1}{i \\hbar} \\left\\langle f\\right|\\hat{H}_1\\left|i\\right\\rangle \\frac{\\mathrm{e}^{i\\omega_0 T}-1}{i\\omega_0},`})}),`
`,(0,n.jsx)(o.p,{children:`and therefore`}),`
`,(0,n.jsx)(o.pre,{children:(0,n.jsx)(o.code,{className:`language-math math-display`,children:`P_{i\\to f} = \\frac{1}{\\hbar^2}\\left|\\left\\langle f\\right|\\hat{V}\\left|i\\right\\rangle\\right|^2 \\underbrace{\\frac{\\sin^2\\left(\\omega_0\\frac{T}{2}\\right)}{\\left(\\frac{\\omega_0}{2}\\right)^2}}_{\\mathrm{y}(\\omega_0,T)}.`})}),`
`,(0,n.jsxs)(o.p,{children:[`A sketch of `,(0,n.jsx)(o.code,{className:`language-math math-inline`,children:`\\mathrm{y}(\\omega_0,T)`}),` is shown below`]}),`
`,(0,n.jsx)(t,{id:`fig-y-function-sketch`,href:a,caption:`A sketch of y`}),`
`,(0,n.jsxs)(o.p,{children:[`We can push this calculation to the extreme case of
`,(0,n.jsx)(o.code,{className:`language-math math-inline`,children:`T\\rightarrow \\infty`}),`. This results in a delta function, which is peaked
round `,(0,n.jsx)(o.code,{className:`language-math math-inline`,children:`\\omega_0 = 0`}),` and we can write:`]}),`
`,(0,n.jsx)(o.pre,{children:(0,n.jsx)(o.code,{className:`language-math math-display`,children:`P_{i\\to f} =  T\\frac{2\\pi}{\\hbar^2}\\left|\\left\\langle f\\right|\\hat{V}\\left|i\\right\\rangle\\right|^2\\delta(\\omega_0)`})}),`
`,(0,n.jsxs)(o.p,{children:[`This is the celebrated `,(0,n.jsx)(o.strong,{children:`Fermi's golden rule`}),`.`]}),`
`,(0,n.jsxs)(o.p,{children:[(0,n.jsx)(o.strong,{children:`Example 2: Sinusoidal Perturbation.`}),` For the perturbation`]}),`
`,(0,n.jsx)(o.pre,{children:(0,n.jsx)(o.code,{className:`language-math math-display`,children:`\\hat{H}_1(t) = \\left\\{ \\begin{array}{ccl} \\hat{H}_1\\mathrm{e}^{-i\\omega t} && \\text{for}\\; 0 < t < T \\\\ 0 &&\\text{otherwise}\\end{array} \\right.`})}),`
`,(0,n.jsx)(o.p,{children:`we obtain the probability`}),`
`,(0,n.jsx)(o.pre,{children:(0,n.jsx)(o.code,{className:`language-math math-display`,children:`P_{i\\to f} (t \\geq T) = \\frac{1}{\\hbar^2} \\left|\\left\\langle f\\right|\\hat{V}\\left|i\\right\\rangle\\right|^2 \\mathrm{y}(\\omega_0 - \\omega, T).`})}),`
`,(0,n.jsxs)(o.p,{children:[`At `,(0,n.jsx)(o.code,{className:`language-math math-inline`,children:`\\omega = \\left|E_f - E_i\\right|/\\hbar`}),` we are on resonance.`]}),`
`,(0,n.jsx)(o.p,{children:`In the fifth lecture, we will start to dive into the hydrogen atom.`}),`
`,(0,n.jsxs)(o.section,{"data-footnotes":!0,className:`footnotes`,children:[(0,n.jsx)(o.h2,{className:`sr-only`,id:`footnote-label`,children:`Footnotes`}),`
`,(0,n.jsxs)(o.ol,{children:[`
`,(0,n.jsxs)(o.li,{id:`user-content-fn-2002`,children:[`
`,(0,n.jsxs)(o.p,{children:[`Jean Dalibard Jean-Louis Basdevant. Quantum Mechanics. Springer-Verlag, 2002. `,(0,n.jsx)(o.a,{href:`#user-content-fnref-2002`,"data-footnote-backref":``,"aria-label":`Back to reference 1`,className:`data-footnote-backref`,children:`↩`})]}),`
`]}),`
`,(0,n.jsxs)(o.li,{id:`user-content-fn-cohen_tannoudji_1998`,children:[`
`,(0,n.jsxs)(o.p,{children:[`Claude Cohen-Tannoudji, Jacques Dupont-Roc, Gilbert Grynberg. Atom-Photon Interactions. Wiley-VCH Verlag GmbH, 1998. `,(0,n.jsx)(o.a,{href:`#user-content-fnref-cohen_tannoudji_1998`,"data-footnote-backref":``,"aria-label":`Back to reference 2`,className:`data-footnote-backref`,children:`↩`})]}),`
`]}),`
`,(0,n.jsxs)(o.li,{id:`user-content-fn-1`,children:[`
`,(0,n.jsxs)(o.p,{children:[`This is the idea behind atomic and optical clocks, which work
nowadays at `,(0,n.jsx)(o.code,{className:`language-math math-inline`,children:`10^{-18}`}),`. `,(0,n.jsx)(o.a,{href:`#user-content-fnref-1`,"data-footnote-backref":``,"aria-label":`Back to reference 3`,className:`data-footnote-backref`,children:`↩`})]}),`
`]}),`
`]}),`
`]})]})}function c(e={}){let{wrapper:t}=e.components||{};return t?(0,n.jsx)(t,{...e,children:(0,n.jsx)(s,{...e})}):s(e)}export{c as default,o as frontmatter};