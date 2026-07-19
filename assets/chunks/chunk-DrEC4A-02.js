import{t as e}from"./chunk-BLhQqvoO.js";var t=e(),n={author:[`fretchen`,`Selim Jochim`],order:2,title:`Lecture 2 - A few more cooking recipes for quantum mechanics`};function r(e){let n={a:`a`,code:`code`,em:`em`,h2:`h2`,h3:`h3`,li:`li`,ol:`ol`,p:`p`,pre:`pre`,section:`section`,strong:`strong`,sup:`sup`,...e.components};return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(n.p,{children:`In this second lecture we will finish the discussion of the basic
cooking recipes and discuss a few of the consequences like the
uncertainty relation, the existance of wave packages and the Ehrenfest
theorem.`}),`
`,(0,t.jsxs)(n.p,{children:[`In the first lecture we discussed briefly the basic
principles of quantum mechanics like operators, state vectors and the
Schrödinger equation. We will finish this discussion today and then
introduce the most important consequences. We will continue to closely
follow the discussion of the introductory chapter of Ref. `,(0,t.jsx)(n.sup,{children:(0,t.jsx)(n.a,{href:`#user-content-fn-2006`,id:`user-content-fnref-2006`,"data-footnote-ref":!0,"aria-describedby":`footnote-label`,children:`1`})})]}),`
`,(0,t.jsx)(n.h2,{children:`Composite systems`}),`
`,(0,t.jsx)(n.p,{children:`It is actually quite rare that we can label the system with a single
quantum number. Any atom will involve spin, position, angular momentum.
Other examples might just involve two spin which we observe. So the
question is then on how we label those systems. We then have two
questions to answer:`}),`
`,(0,t.jsxs)(n.ol,{children:[`
`,(0,t.jsxs)(n.li,{children:[`
`,(0,t.jsx)(n.p,{children:`How many labels do we need for a system to fully determine its
quantum state ?`}),`
`]}),`
`,(0,t.jsxs)(n.li,{children:[`
`,(0,t.jsx)(n.p,{children:`Once I know all the labels, how do I construct the full state out of
them ?`}),`
`]}),`
`]}),`
`,(0,t.jsx)(n.p,{children:`We will actually discuss the second question first as it sets the
notation for the first question.`}),`
`,(0,t.jsx)(n.h3,{children:`Entangled States`}),`
`,(0,t.jsxs)(n.p,{children:[`In AMO we typically would like to characterize is the state of an
electron in a hydrogen atom. We need to define its angular momentum
label `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`L`}),`, which might be 0, 1, 2 and also its electron spin `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`S`}),`, which
might be `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\{\\uparrow, \\downarrow\\}`}),`. It state is then typically labelled
as something like`]}),`
`,(0,t.jsx)(n.p,{children:(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\left|L=0, S=\\uparrow\\right\\rangle = \\left|0,\\uparrow\\right\\rangle`})}),`
`,(0,t.jsx)(n.p,{children:`etc.`}),`
`,(0,t.jsxs)(n.p,{children:[`Another, simple example is that of two spins, each one having two
possible states `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\{\\uparrow, \\downarrow\\}`}),`. This is a standard problem
in optical communication, where you send correlated photons with a
certain polarization to different people. We will typically call them
Alice and Bob `,(0,t.jsx)(n.sup,{children:(0,t.jsx)(n.a,{href:`#user-content-fn-1`,id:`user-content-fnref-1`,"data-footnote-ref":!0,"aria-describedby":`footnote-label`,children:`2`})}),`.`]}),`
`,(0,t.jsxs)(n.p,{children:[`We now would like to understand than if we can disentangle the
information about the different labels. Naively, we can now associate
with Alice one set of outcomes and describe it by some state
`,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\left|\\psi_{A}\\right\\rangle`}),` and the Bob has another set
`,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\left|\\psi_{B}\\right\\rangle`}),`:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`\\left|\\psi_A\\right\\rangle= a_{\\uparrow} \\left|\\uparrow_A\\right\\rangle+ a_{\\downarrow} \\left|\\downarrow_A\\right\\rangle\\\\
\\left|\\psi_B\\right\\rangle= b_{\\uparrow} \\left|\\uparrow_B\\right\\rangle+ b_{\\downarrow} \\left|\\downarrow_B\\right\\rangle`})}),`
`,(0,t.jsxs)(n.p,{children:[`The full state will then be described by the possible outcomes
`,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\{\\uparrow_A\\uparrow_B,\\downarrow_A\\uparrow_B,\\uparrow_A\\downarrow_B, \\downarrow_A\\downarrow_B\\}`}),`.
We can then write:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`\\left|\\psi\\right\\rangle = \\alpha_{\\uparrow\\uparrow}(\\left|\\uparrow_A\\right\\rangle\\otimes\\left|\\uparrow_B\\right\\rangle)+\\alpha_{\\uparrow\\downarrow}(\\left|\\uparrow_A\\right\\rangle\\otimes\\left|\\downarrow_B\\right\\rangle)+\\alpha_{\\downarrow\\uparrow}(\\left|\\downarrow_A\\right\\rangle\\otimes\\left|\\uparrow_B\\right\\rangle)+\\alpha_{\\downarrow\\downarrow}(\\left|\\downarrow_A\\right\\rangle\\otimes\\left|\\downarrow_B\\right\\rangle)\\\\
= \\alpha_{\\uparrow\\uparrow}\\left|\\uparrow\\uparrow\\right\\rangle+\\alpha_{\\uparrow\\downarrow}\\left|\\uparrow\\downarrow\\right\\rangle+\\alpha_{\\downarrow\\uparrow}\\left|\\downarrow \\uparrow\\right\\rangle+\\alpha_{\\downarrow\\downarrow}\\left|\\downarrow\\downarrow\\right\\rangle`})}),`
`,(0,t.jsxs)(n.p,{children:[`So we will typically just plug the labels into a single
ket and drop indices, to avoid rewriting the tensor symbol each time. We
say that a state is `,(0,t.jsx)(n.em,{children:`separable`}),`, if we can write it as a product of the
two individual states as above:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`\\left|\\psi\\right\\rangle = \\left|\\psi_A\\right\\rangle\\otimes\\left|\\psi_B\\right\\rangle\\\\
=a_{\\uparrow} b_\\uparrow \\left|\\uparrow\\uparrow\\right\\rangle+a_{\\downarrow} b_\\uparrow \\left|\\downarrow\\uparrow\\right\\rangle+a_{\\uparrow} b_\\downarrow \\left|\\uparrow\\downarrow\\right\\rangle+a_{\\downarrow} b_\\downarrow \\left|\\downarrow\\downarrow\\right\\rangle`})}),`
`,(0,t.jsxs)(n.p,{children:[`All other states are called `,(0,t.jsx)(n.em,{children:`entangled`}),`. The most famous entangled
states are the Bell states:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`\\left|\\psi_\\textrm{Bell}\\right\\rangle=\\frac{\\left|\\uparrow\\uparrow\\right\\rangle+\\left|\\downarrow\\downarrow\\right\\rangle}{\\sqrt{2}}`})}),`
`,(0,t.jsxs)(n.p,{children:[`In general we will say that the quantum system is formed by two
subsystems `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`S_1`}),` and `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`S_2`}),`. If they are independent we can write each of
them as:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`\\left|\\psi_1\\right\\rangle=\\sum_m^M a_m \\left|\\alpha_m\\right\\rangle,\\\\
\\left|\\psi_2\\right\\rangle=\\sum_n^N b_n \\left|\\beta_n\\right\\rangle.`})}),`
`,(0,t.jsx)(n.p,{children:`In general we will then write:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`\\left|\\psi\\right\\rangle=\\sum_m^M \\sum_n^N c_{mn}(\\left|\\alpha_m\\right\\rangle\\otimes \\left|\\beta_n\\right\\rangle).`})}),`
`,(0,t.jsxs)(n.p,{children:[`So we can determine such a state by `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`M \\times N`}),` numbers
`,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`c_{mn}`}),` here. If the states are `,(0,t.jsx)(n.em,{children:`separable`}),`, we can write
`,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\left|\\psi\\right\\rangle`}),` as a product of the individual
states:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`\\left|\\psi\\right\\rangle=\\left|\\psi_1\\right\\rangle\\otimes\\left|\\psi_2\\right\\rangle=\\left(\\sum_m^M a_m \\left|\\alpha_m\\right\\rangle\\right) \\otimes \\left(\\sum_n^N b_n \\left|\\beta_n\\right\\rangle\\right)`})}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`\\left|\\psi\\right\\rangle=\\sum_m^M \\sum_n^N a_m b_n \\left|\\alpha_m\\right\\rangle \\otimes \\left|\\beta_n\\right\\rangle.`})}),`
`,(0,t.jsx)(n.p,{children:`Separable states thus only describes a small subset of all possible
states.`}),`
`,(0,t.jsx)(n.h2,{children:`Statistical Mixtures and Density Operator`}),`
`,(0,t.jsxs)(n.p,{children:[`Having set up the formalism for writing down the full quantum state with
plenty of labels, we have to solve the next problem. As an
experimentalist, you will rarely measure all of them. This means that
you only perform a partial measurement and you have only partial
information of the system. The extreme case is the thermodynamic
ensemble, where we measure only temperature to describe `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`10^{23}`}),`
particles.`]}),`
`,(0,t.jsx)(n.p,{children:`A similiar problem arises for Alice and Bob. They typically measure the
state of the qubit in their lab without knowing what the other did. So
they need some way to describe the system locally. This is done through
the density operator approach.`}),`
`,(0,t.jsx)(n.p,{children:`In the density operator approach the state of the system is described by
a Hermitian density operator`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:` \\hat{\\rho} = \\sum_{n=1}^N p_n \\left|\\phi_n\\right\\rangle\\left\\langle\\phi_n\\right|.`})}),`
`,(0,t.jsxs)(n.p,{children:[`Here, `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\left\\langle\\phi_n\\right|`}),` are the
eigenstates of `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\hat{\\rho}`}),`, and `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`p_n`}),` are the probabilities to find the
system in the respective states
`,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\left|\\phi_n\\right\\rangle`}),`. The trace of the density
operator is the sum of all probabilities `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`p_n`}),`:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`  \\mathrm{tr}(\\hat{\\rho}) = \\sum p_n = 1.`})}),`
`,(0,t.jsxs)(n.p,{children:[`For a pure state `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\left|\\psi\\right\\rangle`}),`, we get `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`p_n=1`}),`
for only one value of `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`n`}),`. For every other `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`n`}),`, the probabilities
vanish. We thus obtain a "pure" density operator
`,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\hat{\\rho}_{\\text{pure}}`}),` which has the properties of a projection
operator:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`\\hat{\\rho}_{\\text{pure}} = \\left|\\psi\\right\\rangle\\left\\langle\\psi\\right| \\qquad \\Longleftrightarrow \\qquad \\hat{\\rho}^2 = \\hat{\\rho}.`})}),`
`,(0,t.jsx)(n.p,{children:`For the simple qubit we then have:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`\\hat{\\rho}= \\left(\\alpha_\\uparrow\\left|\\uparrow\\right\\rangle+\\alpha_\\downarrow\\left|\\downarrow\\right\\rangle\\right)\\left(\\alpha_\\uparrow^*\\left\\langle\\uparrow\\right|+\\alpha_\\downarrow^*\\left\\langle\\downarrow\\right|\\right)\\\\
  = |\\alpha_\\uparrow|^2\\left|\\uparrow\\right\\rangle\\left\\langle\\uparrow\\right|+|\\alpha_\\downarrow|^2\\left|\\downarrow\\right\\rangle\\left\\langle\\downarrow\\right|+\\alpha_\\downarrow\\alpha_\\uparrow^*\\left|\\downarrow\\right\\rangle\\left\\langle\\uparrow\\right|+\\alpha_\\uparrow\\alpha_\\downarrow^*\\left|\\uparrow\\right\\rangle\\left\\langle\\downarrow\\right|`})}),`
`,(0,t.jsx)(n.p,{children:`Then it is even simpler to write in matrix form:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`  \\hat{\\rho}= \\left(\\begin{array}{cc}
  |\\alpha_\\uparrow|^2&\\alpha_\\uparrow\\alpha_\\downarrow^*\\\\
  \\alpha_\\downarrow\\alpha_\\uparrow^*&|\\alpha_\\downarrow|^2
  \\end{array}\\right)`})}),`
`,(0,t.jsx)(n.p,{children:`For a thermal state on the other hand we have:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`\\hat{\\rho}_{\\text{thermal}} = \\sum_{n=1}^N \\frac{e^{-\\frac{E_n}{k_BT}}}{Z} \\left|\\phi_n\\right\\rangle\\left\\langle\\phi_n\\right|\\text{ with }Z = \\sum_{n=1}^N e^{-\\frac{E_n}{k_BT}}`})}),`
`,(0,t.jsxs)(n.p,{children:[`With this knowledge we can now determine the result of a
measurement of an observable `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`A`}),` belonging to an operator `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\hat{A}`}),`. For
the pure state `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\left|\\psi\\right\\rangle`}),` we get:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`\\langle \\hat{A}\\rangle = \\left\\langle\\psi\\right| \\hat{A} \\left|\\psi\\right\\rangle.`})}),`
`,(0,t.jsx)(n.p,{children:`For a mixed state we get:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`\\langle \\hat{A}\\rangle = \\mathrm{tr}(\\hat{\\rho}\\cdot \\hat{A}) = \\sum_n {p_n} \\left\\langle\\phi_n\\right| \\hat{A} \\left|\\phi_n\\right\\rangle.`})}),`
`,(0,t.jsx)(n.p,{children:`The time evolution of the density operator can be
expressed with the von Neumann equation:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`i\\hbar \\partial_{t}\\hat{\\rho}(t) = [\\hat{H}(t),\\hat{\\rho}(t)].`})}),`
`,(0,t.jsx)(n.h3,{children:`Back to partial measurements`}),`
`,(0,t.jsx)(n.p,{children:`We can now come back to the correlated photons sent to Alice and Bob,
sharing a Bell pair. They full density matrix is then especially simple:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`  \\hat{\\rho}= \\left(\\begin{array}{cccc}
  \\frac{1}{2}& 0& 0 &\\frac{1}{2}\\\\
  0 & 0 & 0& 0\\\\
  0&0&0&0\\\\
    \\frac{1}{2}&0&0&\\frac{1}{2}
  \\end{array}\\right)`})}),`
`,(0,t.jsxs)(n.p,{children:[`Let us write the system as `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`S = S_A \\otimes S_B`}),`. If we are looking for
the density operator `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\hat{\\rho}_i`}),` of each individual, we can simply
write:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`\\hat{\\rho}_A=\\mathrm{tr}_{B}(\\hat{\\rho}),\\\\
\\hat{\\rho}_B=\\mathrm{tr}_{A}(\\hat{\\rho}),`})}),`
`,(0,t.jsxs)(n.p,{children:[`where
`,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\hat{\\rho}=\\left|\\psi\\right\\rangle\\left\\langle\\psi\\right|`}),`
and `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\mathrm{tr}_{j}(\\hat{\\rho})`}),` is the trace over the Hilbert space of
subsystem `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`j`}),`.`]}),`
`,(0,t.jsx)(n.p,{children:`To reduce the density matrix of the Bell state it is actually helpful to
write out the definitions:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`\\mathrm{tr}_{B}(\\hat{\\rho}) = \\left\\langle\\uparrow_B\\right|\\hat{\\rho}\\left|\\uparrow_B\\right\\rangle+\\left\\langle\\downarrow_B\\right|\\hat{\\rho}\\left|\\downarrow_B\\right\\rangle\\\\
=\\frac{1}{2}\\left(\\left|\\uparrow_A\\right\\rangle\\left\\langle\\uparrow_A\\right|+\\left|\\downarrow_A\\right\\rangle\\left\\langle\\downarrow_A\\right|\\right)`})}),`
`,(0,t.jsx)(n.p,{children:`So we end up with the fully mixed state:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`  \\hat{\\rho}_{A,B} = \\left(\\begin{array}{cc}
  \\frac{1}{2}&0\\\\
  0&\\frac{1}{2}
  \\end{array}\\right)`})}),`
`,(0,t.jsx)(n.p,{children:`Alice and Bob are simply cossing a coin if they ignore
the outcome of the other member. But once they start comparing results
we will see that the quantum case can dramatically differ from the
classical case. This will be the content of lecture 12 [@entanglement].`}),`
`,(0,t.jsx)(n.h2,{children:`Important Consequences of the Principles`}),`
`,(0,t.jsx)(n.h3,{children:`Uncertainty Relation`}),`
`,(0,t.jsx)(n.p,{children:`The product of the variances o two noncommuting operators has a lower
limit:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`    \\Delta \\hat{A} \\cdot \\Delta \\hat{B} \\geq \\frac{1}{2} \\left| \\left\\langle\\left[\\hat{A,\\hat{B}}\\right]\\right\\rangle \\right|,`})}),`
`,(0,t.jsxs)(n.p,{children:[`where the variance is defined as
`,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\Delta \\hat{A} = \\sqrt{\\left\\langle\\hat{A^2}\\right\\rangle-\\left\\langle\\hat{A}^2\\right\\rangle}`}),`.`]}),`
`,(0,t.jsx)(n.p,{children:(0,t.jsx)(n.strong,{children:`Examples.`})}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`\\left[ \\hat{x}, \\hat{p} \\right] = i \\hbar \\\\
\\left[ \\hat{J}_i , \\hat{J}_j \\right] = i \\hbar \\epsilon_{ijk} \\hat{J}_k`})}),`
`,(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.strong,{children:`Note.`}),` This is a statement about the `,(0,t.jsx)(n.em,{children:`state`}),` itself, and not the
measurement!`]}),`
`,(0,t.jsx)(n.h3,{children:`Ehrenfest Theorem`}),`
`,(0,t.jsxs)(n.p,{children:[`With the Ehrenfest theorem, one can determine the time evolution of the
expectation value of an operator `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\hat{A}`}),`:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:` \\frac{d}{dt}\\left\\langle\\hat{A}\\right\\rangle=\\frac{1}{i\\hbar}\\left\\langle\\left[\\hat{A},\\hat{H}\\right]\\right\\rangle+\\left\\langle\\partial_t\\hat{A}(t)\\right\\rangle.`})}),`
`,(0,t.jsxs)(n.p,{children:[`If `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\hat{A}`}),` is time-independent and
`,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\left[\\hat{A},\\hat{H}\\right]=0`}),`, the expectation value
`,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\left\\langle\\hat{A}\\right\\rangle`}),` is a constant of the
motion.`]}),`
`,(0,t.jsx)(n.h3,{children:`Complete Set of Commuting Observables`}),`
`,(0,t.jsxs)(n.p,{children:[`A set of commuting operators
`,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\{\\hat{A},\\hat{B},\\hat{C},\\cdots,\\hat{X}\\}`}),` is considered a complete
set if their common eigenbasis is unique. Thus, the measurement of all
quantities `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\{A,B,\\cdots,X\\}`}),` will determine the system uniquely. The
clean identification of such a Hilbert space can be quite challenging
and a nice way of its measurment even more. Coming back to our previous
examples:`]}),`
`,(0,t.jsxs)(n.ol,{children:[`
`,(0,t.jsxs)(n.li,{children:[`
`,(0,t.jsx)(n.p,{children:`Performing the full spectroscopy of the atom. Even for the hydrogen
atom we will see that the full answer can be rather involved...`}),`
`]}),`
`,(0,t.jsxs)(n.li,{children:[`
`,(0,t.jsx)(n.p,{children:`The occupation number is rather straight forward. However, we have
to be careful that we really collect a substantial amount of the
photons etc.`}),`
`]}),`
`,(0,t.jsxs)(n.li,{children:[`
`,(0,t.jsx)(n.p,{children:`Are we able to measure the full position information ? What is the
resolution of the detector and the point-spread function ?`}),`
`]}),`
`,(0,t.jsxs)(n.li,{children:[`
`,(0,t.jsx)(n.p,{children:`Here it is again rather clean to put a very efficient detector at
the output of the two arms ...`}),`
`]}),`
`,(0,t.jsxs)(n.li,{children:[`
`,(0,t.jsxs)(n.p,{children:[`What are the components of the spin that we can access ? The `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`z`}),`
component does not commute with the other components, so what should
we measure ?`]}),`
`]}),`
`]}),`
`,(0,t.jsxs)(n.p,{children:[`In the `,(0,t.jsx)(n.a,{href:`https://www.authorea.com/326444/GsbfEypTdf4dvncV23L8_Q`,children:`third
lecture`}),` of this
course will start to apply these discussions to the two-level system,
which is one of the simplest yet most powerful models of quantum
mechanics.`]}),`
`,(0,t.jsxs)(n.section,{"data-footnotes":!0,className:`footnotes`,children:[(0,t.jsx)(n.h2,{className:`sr-only`,id:`footnote-label`,children:`Footnotes`}),`
`,(0,t.jsxs)(n.ol,{children:[`
`,(0,t.jsxs)(n.li,{id:`user-content-fn-2006`,children:[`
`,(0,t.jsxs)(n.p,{children:[`Jean Dalibard Jean-Louis Basdevant. The Quantum Mechanics Solver. Springer-Verlag, 2006. `,(0,t.jsx)(n.a,{href:`#user-content-fnref-2006`,"data-footnote-backref":``,"aria-label":`Back to reference 1`,className:`data-footnote-backref`,children:`↩`})]}),`
`]}),`
`,(0,t.jsxs)(n.li,{id:`user-content-fn-1`,children:[`
`,(0,t.jsxs)(n.p,{children:[`And if someone wants to listen the person is called Eve `,(0,t.jsx)(n.a,{href:`#user-content-fnref-1`,"data-footnote-backref":``,"aria-label":`Back to reference 2`,className:`data-footnote-backref`,children:`↩`})]}),`
`]}),`
`]}),`
`]})]})}function i(e={}){let{wrapper:n}=e.components||{};return n?(0,t.jsx)(n,{...e,children:(0,t.jsx)(r,{...e})}):r(e)}export{i as default,n as frontmatter};