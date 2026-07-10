import{t as e}from"./chunk-BLhQqvoO.js";var t=e(),n={author:[`fretchen`,`Selim Jochim`],order:1,title:`Lecture 1 - Some cooking recipes for Quantum Mechanics`};function r(e){let n={a:`a`,code:`code`,em:`em`,h1:`h1`,h2:`h2`,li:`li`,ol:`ol`,p:`p`,pre:`pre`,section:`section`,strong:`strong`,sup:`sup`,ul:`ul`,...e.components};return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(n.p,{children:`In this first lecture we will review the foundations of quantum
mechanics at the level of a cooking recipe. This will enable us to use
them later for the discussion of the atomic structure and interaction
between atoms and light.`}),`
`,(0,t.jsx)(n.p,{children:`This is the first lecture of the Advanced Atomic Physics course at
Heidelberg University, as tought in the wintersemester 2019/2020. It is
intended for master students, which have a basic understanding of
quantum mechanics and electromagnetism. In total, we will study multiple
topics of modern atomic, molecular and optical physics over a total of
24 lectures, where each lectures is approximately 90 minutes.`}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsxs)(n.li,{children:[`
`,(0,t.jsx)(n.p,{children:`We will start the series with some basics on quantum mechanics.`}),`
`]}),`
`,(0,t.jsxs)(n.li,{children:[`
`,(0,t.jsx)(n.p,{children:`Then work our way into the harmonic oscillator and the hydrogen
atom.`}),`
`]}),`
`,(0,t.jsxs)(n.li,{children:[`
`,(0,t.jsx)(n.p,{children:`We will then leave the path of increasingly complex atoms for a
moment to have some fun with light-propagation, lasers and
discussion of the Bell inequalities.`}),`
`]}),`
`,(0,t.jsxs)(n.li,{children:[`
`,(0,t.jsx)(n.p,{children:`A discussion of more complex atoms gives us the acutual tools at
hand that are in the lab.`}),`
`]}),`
`,(0,t.jsxs)(n.li,{children:[`
`,(0,t.jsx)(n.p,{children:`This sets up a discussion of di-atomic molecules, which ends the
old-school AMO.`}),`
`]}),`
`,(0,t.jsxs)(n.li,{children:[`
`,(0,t.jsx)(n.p,{children:`We move on to quantized atom-light interaction, the Jaynes Cummings
model and strong-field lasers.`}),`
`]}),`
`,(0,t.jsxs)(n.li,{children:[`
`,(0,t.jsx)(n.p,{children:`We will finally finish with modern ways to implement quantum
simulators and quantum computers.`}),`
`]}),`
`]}),`
`,(0,t.jsx)(n.p,{children:`The topics of the lectures will be discussed in more details in the
associated tutorials.`}),`
`,(0,t.jsx)(n.h1,{children:`Introduction`}),`
`,(0,t.jsx)(n.p,{children:`In AMO physics we will encounter the consequences of quantum mechanics
all the time. So we will start out with a review of the basic
ingredients to facilitate the later discussion of the experiments.`}),`
`,(0,t.jsxs)(n.p,{children:[`Some good introductions on the traditional approach can be found in
`,(0,t.jsx)(n.sup,{children:(0,t.jsx)(n.a,{href:`#user-content-fn-2002`,id:`user-content-fnref-2002`,"data-footnote-ref":!0,"aria-describedby":`footnote-label`,children:`1`})}),`, `,(0,t.jsx)(n.sup,{children:(0,t.jsx)(n.a,{href:`#user-content-fn-2006`,id:`user-content-fnref-2006`,"data-footnote-ref":!0,"aria-describedby":`footnote-label`,children:`2`})}),`, `,(0,t.jsx)(n.sup,{children:(0,t.jsx)(n.a,{href:`#user-content-fn-ct1`,id:`user-content-fnref-ct1`,"data-footnote-ref":!0,"aria-describedby":`footnote-label`,children:`3`})}),`, `,(0,t.jsx)(n.sup,{children:(0,t.jsx)(n.a,{href:`#user-content-fn-ct2`,id:`user-content-fnref-ct2`,"data-footnote-ref":!0,"aria-describedby":`footnote-label`,children:`4`})}),`. Previously, we mostly followed the discussion
of Ref. `,(0,t.jsx)(n.sup,{children:(0,t.jsx)(n.a,{href:`#user-content-fn-2006`,id:`user-content-fnref-2006-2`,"data-footnote-ref":!0,"aria-describedby":`footnote-label`,children:`2`})}),`. Nowadays, I also recommend the works by Scott Aaronson in `,(0,t.jsx)(n.a,{href:`https://scottaaronson.com/democritus/lec9.html`,children:`this`}),` and `,(0,t.jsx)(n.a,{href:`https://www.scottaaronson.com/barbados-2016.pdf`,children:`this lecture`}),`. There is also a good `,(0,t.jsx)(n.a,{href:`https://www.quantamagazine.org/quantum-theory-rebuilt-from-simple-physical-principles-20170830/#`,children:`article by
Quanta-Magazine`}),`
on the whole effort to derive quantum mechanics from some simple
principles. This effort started with `,(0,t.jsx)(n.a,{href:`https://arxiv.org/abs/quant-ph/0101012v4`,children:`this paper`}),`, which actually
makes for a nice read.`]}),`
`,(0,t.jsx)(n.p,{children:`Before we start with the detailled cooking recipe let us give you some
examples of quantum systems, which are of major importance throughout
the lecture:`}),`
`,(0,t.jsxs)(n.ol,{children:[`
`,(0,t.jsxs)(n.li,{children:[`
`,(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.em,{children:`Orbit in an atom, molecule etc`}),`. Most of you might have studied
this during the introduction into quantum mechanics.`]}),`
`]}),`
`,(0,t.jsxs)(n.li,{children:[`
`,(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.em,{children:`Occupation number of a photon mode`}),`. Any person working on quantum
optics has to understand the quantum properties of photons.`]}),`
`]}),`
`,(0,t.jsxs)(n.li,{children:[`
`,(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.em,{children:`Position of an atom`}),` is of great importance for double slit
experiments, the quantum simulation of condensed matter systems with
atoms, or matterwave experiments.`]}),`
`]}),`
`,(0,t.jsxs)(n.li,{children:[`
`,(0,t.jsxs)(n.p,{children:[`The `,(0,t.jsx)(n.em,{children:`spin degree of freedom`}),` of an atom like in the historical
Stern-Gerlach experiment.`]}),`
`]}),`
`,(0,t.jsxs)(n.li,{children:[`
`,(0,t.jsx)(n.p,{children:`The classical coin-toss or bit, which connects us nicely to simple
classical probability theory or computing`}),`
`]}),`
`]}),`
`,(0,t.jsx)(n.h1,{children:`The possible outcomes (the Hilbert Space) for the Problem in Question`}),`
`,(0,t.jsxs)(n.p,{children:[`The first step is to identify the right Hilbert space for your problem.
For a classical problem, we would simply list all the different possible
outcomes in a list `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`(p_1, \\cdots, p_N)`}),` of `,(0,t.jsx)(n.em,{children:`real`}),` numbers. As one of the
outcomes has to happen, we obtain the normalization condition:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:` \\sum_i p_i = 1`})}),`
`,(0,t.jsxs)(n.p,{children:[`In quantum mechanics, we follow a similar approach of first identifying
the possible outcomes. But instead of describing the outcomes with real
numbers, we now associate a complex number `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\alpha_i`}),` to each outcome
`,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`(\\alpha_1, \\cdots, \\alpha_N)`}),`, with `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\alpha_i \\in \\mathbb{C}`}),`. Given
that they should also describe some probability they have to be
normalized to one, but now we have the condition:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`\\sum_i |\\alpha_i|^2 = 1`})}),`
`,(0,t.jsxs)(n.p,{children:[`Aaronson claims that this is just measuring probabilities in in `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`L_2`}),`
norm. I would highly recommend his discussions on his blog for a more
instructive derivation[@quantum]. Next we will not use the traditional
lists, but the bra-ket notation, by writing:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`\\left|\\psi\\right\\rangle = \\sum_i \\alpha_i \\left|i\\right\\rangle`})}),`
`,(0,t.jsx)(n.p,{children:`And given that these are complex vectors, we will measure their overlap
through a Hermitian scalar product`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`\\langle\\psi_1 \\psi_2\\rangle=(\\langle{\\psi_2}| \\psi_1\\rangle)^*.`})}),`
`,(0,t.jsx)(n.h2,{children:`The coin toss`}),`
`,(0,t.jsxs)(n.p,{children:[`The situation becomes particularly nice to follow for the two level
system or the coin toss. In classical systems, we will get heads up
`,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\uparrow`}),` with a certain probability p. So the inverse `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\downarrow`}),`
arrives with likelyhood `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`1-p`}),`. We would then classical list the
probabilities with `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`(p,1-p)`}),`. In the quantum world we achieve such a
coin for example in spin 1/2 systems or qubits in general. We will then
describe the system through the state:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`\\left|\\psi\\right\\rangle = \\alpha_\\uparrow \\left|\\uparrow\\right\\rangle + \\alpha_\\downarrow \\left|\\downarrow\\right\\rangle  \\qquad \\text{with} \\; \\langle\\psi | \\psi\\rangle = 1.`})}),`
`,(0,t.jsx)(n.p,{children:`The next problem is how to act on the system in the classical world or
in the quantum world.`}),`
`,(0,t.jsx)(n.h2,{children:`Quantum rules`}),`
`,(0,t.jsxs)(n.p,{children:[`Having set up the space on which we want to act we have to follow the
rules of quantum mechanics. The informal way of describing is actually
nicely described by Chris Monroe `,(0,t.jsx)(n.a,{href:`https://youtu.be/CC7nlBM2cSM`,children:`in this
video`}),`. We might summarize them as
follows:`]}),`
`,(0,t.jsxs)(n.ol,{children:[`
`,(0,t.jsxs)(n.li,{children:[`
`,(0,t.jsx)(n.p,{children:`Quantum objects can be in several states at the same time.`}),`
`]}),`
`,(0,t.jsxs)(n.li,{children:[`
`,(0,t.jsx)(n.p,{children:`Rule number one only works when you are not looking.`}),`
`]}),`
`]}),`
`,(0,t.jsx)(n.p,{children:`The more methematical fashion is two say that there two ways of
manipulating quantum states:`}),`
`,(0,t.jsxs)(n.ol,{children:[`
`,(0,t.jsxs)(n.li,{children:[`
`,(0,t.jsxs)(n.p,{children:[`Unitary transformations `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\hat{U}`}),`.`]}),`
`]}),`
`,(0,t.jsxs)(n.li,{children:[`
`,(0,t.jsx)(n.p,{children:`Measurements.`}),`
`]}),`
`]}),`
`,(0,t.jsx)(n.h1,{children:`Unitary transformations`}),`
`,(0,t.jsxs)(n.p,{children:[`As states change and evolve, we know that the total probability should
be conserved. So we transform the state by some operator `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\hat{U}`}),`,
which just maps the state
`,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\left|\\psi\\right\\rangle\\xrightarrow[]{U}\\left|\\psi'\\right\\rangle`}),`.
This should not change the norm, and we obtain the condition:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`\\left\\langle\\psi\\right|\\hat{U}^\\dag\\hat{U} \\left|\\psi\\right\\rangle = 1\\\\
\\hat{U}^\\dag\\hat{U}  = \\mathbb{1}`})}),`
`,(0,t.jsx)(n.p,{children:`That's the very definition of unitary operators and
unitary matrices. Going back to the case of a coin toss, we see that we
can then transform our qubit through the unitary operator:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`\\hat{U}=\\frac{1}{\\sqrt{2}}\\left(\\begin{array}{cc}
1 & -1\\\\
1 & 1
\\end{array}\\right)`})}),`
`,(0,t.jsxs)(n.p,{children:[`Applying it on the previously defined states `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\uparrow`}),`
and `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\downarrow`}),`, we get the superposition state:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`\\hat{U}\\left|\\uparrow\\right\\rangle = \\frac{\\left|\\uparrow\\right\\rangle-\\left|\\downarrow\\right\\rangle}{\\sqrt{2}}\\\\
\\hat{U}\\left|\\downarrow\\right\\rangle = \\frac{\\left|\\uparrow\\right\\rangle+\\left|\\downarrow\\right\\rangle}{\\sqrt{2}}`})}),`
`,(0,t.jsx)(n.p,{children:`As we use the unitary matrices we also see why we might
one to use complex numbers. Imagine that we would like to do something
that is roughly the square root of the unitary, which often just means
that the system should evolve for half the time as we will see later. If
we then have negative nummbers, they will immediately become imaginary.`}),`
`,(0,t.jsx)(n.p,{children:`Such superposition would not be possible in the classical case, as
non-negative values are forbidden there. Actually, operations on
classical propability distributions are only possible if every entry of
the matrix is non-negative (probabilities are never negative right ?)
and each column adds up to one (we cannot loose something in a
transformation). Such matrices are called .`}),`
`,(0,t.jsx)(n.h1,{children:`Observables and Measurements`}),`
`,(0,t.jsxs)(n.p,{children:[`As much fun as it might be to manipulate a quantum state, we also have
to measure it and how it connects to the properties of the system at
hand. Any given physical quantity `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`A`}),` is associated with a Hermitian
operator `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\hat{A} = \\hat{A}^\\dag`}),` acting in the Hilbert space of the
system, which we defined previously. Please, be utterly aware that those
Hermitian operators have absolutely no need to be unitary. However, any
unitary operator might be written as `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\hat{U}= e^{i\\hat{A}}`}),`.`]}),`
`,(0,t.jsxs)(n.p,{children:[`In a `,(0,t.jsx)(n.em,{children:`measurement`}),` , the possible outcomes are then the eigenvalues
`,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`a_\\alpha`}),` of the operator `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\hat{A}`}),`:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`\\hat{A}\\left|\\alpha\\right\\rangle=a_{\\alpha}\\left|\\alpha\\right\\rangle.`})}),`
`,(0,t.jsxs)(n.p,{children:[`The system will collapse to the corresponding
eigenvector and the probability of finding the system in state
`,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\left|\\alpha\\right\\rangle`}),` is`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`P(\\left|\\alpha\\right\\rangle)=||\\hat{P}_{\\left|\\alpha\\right\\rangle} \\left|\\psi\\right\\rangle||^2 = \\left\\langle\\psi\\right| \\hat{P}^{\\dag}_{\\left|\\alpha\\right\\rangle} \\hat{P}_{\\left|\\alpha\\right\\rangle} \\left|\\psi\\right\\rangle,`})}),`
`,(0,t.jsxs)(n.p,{children:[`where
`,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\hat{P}_{\\left|\\alpha\\right\\rangle}= \\left|\\alpha\\right\\rangle \\left\\langle\\alpha\\right|`}),`.`]}),`
`,(0,t.jsx)(n.p,{children:`As for our previous examples, how would you measure them typically, i.e.
what would be the operator ?`}),`
`,(0,t.jsxs)(n.ol,{children:[`
`,(0,t.jsxs)(n.li,{children:[`
`,(0,t.jsx)(n.p,{children:`In atoms the operators will be angular moment, radius, vibrations
etc.`}),`
`]}),`
`,(0,t.jsxs)(n.li,{children:[`
`,(0,t.jsx)(n.p,{children:`For the occupation number we have nowadays number counting
photodectors.`}),`
`]}),`
`,(0,t.jsxs)(n.li,{children:[`
`,(0,t.jsx)(n.p,{children:`The position of an atom might be detected through high-resolution
CCD cameras.`}),`
`]}),`
`,(0,t.jsxs)(n.li,{children:[`
`,(0,t.jsxs)(n.p,{children:[`For the `,(0,t.jsx)(n.em,{children:`measurement of the spin`}),`, we typically correlate the
internal degree of freedom to the spatial degree of freedom. This is
done by applying a magnetic field gradient acting on the magnetic
moment `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\hat{\\vec{\\mu}}`}),` , which in turn is associated with the spin
via `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\hat{\\vec{\\mu}} = g \\mu_B \\hat{\\vec{s}}/\\hbar`}),`, where `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`g`}),` is
the Landé `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`g`}),`-factor and `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\mu_B`}),` is the Bohr magneton . The energy
of the system is `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\hat{H} = -\\hat{\\vec{\\mu}} \\cdot \\vec{B}`}),`.`]}),`
`]}),`
`]}),`
`,(0,t.jsx)(n.h1,{children:`Time Evolution`}),`
`,(0,t.jsxs)(n.p,{children:[`Being able to access the operator values and intialize the wavefunction
in some way, we also want to have a prediction on its time-evolution.
For most cases of this lecture we can simply describe the system by the
non-relativistic `,(0,t.jsx)(n.strong,{children:`Schrödinger Equation.`}),` It reads`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`i\\hbar\\partial_t\\left|\\psi(t)\\right\\rangle=\\hat{H}(t)\\left|\\psi(t)\\right\\rangle.`})}),`
`,(0,t.jsxs)(n.p,{children:[`In general, the Hamilton operator `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\hat{H}`}),` is
time-dependent. For a time-independent Hamilton operator `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\hat{H}`}),`, we
can find eigenstates `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\left|\\phi_n\\right\\rangle`}),` with
corresponding eigenenergies `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`E_n`}),` :`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`\\hat{H}\\left|\\phi_n\\right\\rangle=E_n\\left|\\phi_n\\right\\rangle.`})}),`
`,(0,t.jsxs)(n.p,{children:[`The eigenstates `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\left|\\phi_n\\right\\rangle`}),`
in turn have a simple time evolution:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`    \\left|\\phi_n(t)\\right\\rangle=\\left|\\phi_n(0)\\right\\rangle\\cdot \\exp{-i E_nt/\\hbar}.`})}),`
`,(0,t.jsx)(n.p,{children:`If we know the initial state of a system`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`\\left|\\psi(0)\\right\\rangle=\\sum_n \\alpha_n\\left|\\phi_n\\right\\rangle,`})}),`
`,(0,t.jsxs)(n.p,{children:[`where `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\alpha_n=\\langle\\phi_n | \\psi(0)\\rangle`}),`, we will
know the full dimension time evolution`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`\\left|\\psi(t)\\right\\rangle=\\sum_n\\alpha_n\\left|\\phi_n\\right\\rangle\\exp{-i E_n t/\\hbar}. \\;\\, \\text{(Schrödinger picture)}`})}),`
`,(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.strong,{children:`Note.`}),` Sometimes it is beneficial to work in the
Heisenberg picture, which works with static ket vectors
`,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\left|\\psi\\right\\rangle^{(H)}`}),` and incorporates the time
evolution in the operators. `,(0,t.jsx)(n.sup,{children:(0,t.jsx)(n.a,{href:`#user-content-fn-1`,id:`user-content-fnref-1`,"data-footnote-ref":!0,"aria-describedby":`footnote-label`,children:`5`})}),` In certain cases one would have to have
access to relativistic dynamics, which are then described by the `,(0,t.jsx)(n.strong,{children:`Dirac
equation`}),`. However, we will only touch on this topic very briefly, as
it directly leads us into the intruiging problems of `,(0,t.jsx)(n.strong,{children:`quantum
electrodynamics`}),`.`]}),`
`,(0,t.jsx)(n.h2,{children:`The Heisenberg picture`}),`
`,(0,t.jsx)(n.p,{children:`As mentionned in the first lecture it can benefitial to work in the
Heisenberg picture instead of the Schrödinger picture. This approach is
widely used in the field of many-body physics, as it underlies the
formalism of the second quantization. To make the connection with the
Schrödinger picture we should remember that we have the formal solution
of`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`\\left|\\psi(t)\\right\\rangle = \\mathrm{e}^{-i\\hat{H}t}\\left|\\psi(0)\\right\\rangle`})}),`
`,(0,t.jsx)(n.p,{children:`So, if we would like to look into the expectation value
of some operator, we have:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`\\langle\\hat{A}(t)\\rangle = \\left\\langle\\psi(0)\\right|\\mathrm{e}^{i\\hat{H}t}\\hat{A}_S\\mathrm{e}^{-i\\hat{H}t}\\left|\\psi(0)\\right\\rangle`})}),`
`,(0,t.jsx)(n.p,{children:`This motivates the following definition of the operator
in the Heisenberg picture:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`    \\hat{A}_H=\\mathrm{e}^{i{\\hat{H} t}/{\\hbar}} \\hat{A}_S \\mathrm{e}^{-i{\\hat{H} t}/{\\hbar}}`})}),`
`,(0,t.jsxs)(n.p,{children:[`where `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\exp{-i{\\hat{H} t}/{\\hbar}}`}),` is a time evolution
operator (N.B.: `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\hat{H}_S = \\hat{H}_H`}),`). The time evolution of
`,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\hat{A}_H`}),` is:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`\\frac{d}{dt} \\hat{A}_H = \\frac{i}{\\hbar}\\hat{H}\\mathrm{e}^{i{\\hat{H}t}/{\\hbar}}\\hat{A}_S \\mathrm{e}^{-i{\\hat{H} t}/{\\hbar}}\\\\
-\\frac{i}{\\hbar} \\mathrm{e}^{i{\\hat{H} t}/{\\hbar}}\\hat{A}_S \\mathrm{e}^{-i{\\hat{H}t}/{\\hbar}}\\hat{H}+\\partial_t \\hat{A}_H\\\\
= \\frac{i}{\\hbar}\\left[\\hat{H},\\hat{A}_H\\right] + \\mathrm{e}^{i{\\hat{H}t}/{\\hbar}}\\partial_t\\hat{A}_S\\mathrm{e}^{-i{\\hat{H}t}/{\\hbar}}`})}),`
`,(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.strong,{children:`Note.`}),` In the Heisenberg picture the state vectors
are time-independent:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`    \\left|\\psi\\right\\rangle_H \\equiv \\left|\\psi(t=0)\\right\\rangle=\\exp{i{\\hat{H}}t/{\\hbar}} \\left|\\psi(t)\\right\\rangle.`})}),`
`,(0,t.jsx)(n.p,{children:`Therefore, the results of measurements are the same in
both pictures:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:` \\left\\langle\\psi(t)\\right|\\hat{A}\\left|\\psi(t)\\right\\rangle = \\left\\langle\\psi\\right|_H \\hat{A}_H \\left|\\psi\\right\\rangle_H.`})}),`
`,(0,t.jsxs)(n.section,{"data-footnotes":!0,className:`footnotes`,children:[(0,t.jsx)(n.h2,{className:`sr-only`,id:`footnote-label`,children:`Footnotes`}),`
`,(0,t.jsxs)(n.ol,{children:[`
`,(0,t.jsxs)(n.li,{id:`user-content-fn-2002`,children:[`
`,(0,t.jsxs)(n.p,{children:[`Dalibard Basdevant. Quantum Mechanics. Springer-Verlag, 2002 `,(0,t.jsx)(n.a,{href:`#user-content-fnref-2002`,"data-footnote-backref":``,"aria-label":`Back to reference 1`,className:`data-footnote-backref`,children:`↩`})]}),`
`]}),`
`,(0,t.jsxs)(n.li,{id:`user-content-fn-2006`,children:[`
`,(0,t.jsxs)(n.p,{children:[`Jean Dalibard Jean-Louis Basdevant. The Quantum Mechanics Solver. Springer-Verlag, 2006. `,(0,t.jsx)(n.a,{href:`#user-content-fnref-2006`,"data-footnote-backref":``,"aria-label":`Back to reference 2`,className:`data-footnote-backref`,children:`↩`}),` `,(0,t.jsxs)(n.a,{href:`#user-content-fnref-2006-2`,"data-footnote-backref":``,"aria-label":`Back to reference 2-2`,className:`data-footnote-backref`,children:[`↩`,(0,t.jsx)(n.sup,{children:`2`})]})]}),`
`]}),`
`,(0,t.jsxs)(n.li,{id:`user-content-fn-ct1`,children:[`
`,(0,t.jsxs)(n.p,{children:[`Quantum Mechanics, Volume 1. `,(0,t.jsx)(n.a,{href:`#user-content-fnref-ct1`,"data-footnote-backref":``,"aria-label":`Back to reference 3`,className:`data-footnote-backref`,children:`↩`})]}),`
`]}),`
`,(0,t.jsxs)(n.li,{id:`user-content-fn-ct2`,children:[`
`,(0,t.jsxs)(n.p,{children:[`Quantum Mechanics, Volume 2. `,(0,t.jsx)(n.a,{href:`#user-content-fnref-ct2`,"data-footnote-backref":``,"aria-label":`Back to reference 4`,className:`data-footnote-backref`,children:`↩`})]}),`
`]}),`
`,(0,t.jsxs)(n.li,{id:`user-content-fn-1`,children:[`
`,(0,t.jsxs)(n.p,{children:[`We will follow this route in the discussion of the two-level
system and the Bloch sphere. `,(0,t.jsx)(n.a,{href:`#user-content-fnref-1`,"data-footnote-backref":``,"aria-label":`Back to reference 5`,className:`data-footnote-backref`,children:`↩`})]}),`
`]}),`
`]}),`
`]})]})}function i(e={}){let{wrapper:n}=e.components||{};return n?(0,t.jsx)(n,{...e,children:(0,t.jsx)(r,{...e})}):r(e)}export{i as default,n as frontmatter};