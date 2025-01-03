---
author:
  - Fred Jendrzejewski
  - Selim Jochim
bibliography:
  - bibliography/converted_to_latex.bib
date: January 03, 2025
title: Lecture 1 - Some cooking recipes for Quantum Mechanics
---

In this first lecture we will review the foundations of quantum
mechanics at the level of a cooking recipe. This will enable us to use
them later for the discussion of the atomic structure and interaction
between atoms and light.

This is the first lecture of the Advanced Atomic Physics course at
Heidelberg University, as tought in the wintersemester 2019/2020. It is
intended for master students, which have a basic understanding of
quantum mechanics and electromagnetism. In total, we will study multiple
topics of modern atomic, molecular and optical physics over a total of
24 lectures, where each lectures is approximately 90 minutes.

- We will start the series with some basics on quantum mechanics.

- Then work our way into the harmonic oscillator and the hydrogen
  atom.

- We will then leave the path of increasingly complex atoms for a
  moment to have some fun with light-propagation, lasers and
  discussion of the Bell inequalities.

- A discussion of more complex atoms gives us the acutual tools at
  hand that are in the lab.

- This sets up a discussion of di-atomic molecules, which ends the
  old-school AMO.

- We move on to quantized atom-light interaction, the Jaynes Cummings
  model and strong-field lasers.

- We will finally finish with modern ways to implement quantum
  simulators and quantum computers.

The topics of the lectures will be discussed in more details in the
associated tutorials.

# Introduction

In AMO physics we will encounter the consequences of quantum mechanics
all the time. So we will start out with a review of the basic
ingredients to facilitate the later discussion of the experiments.

Some good introductions on the traditional approach can be found in
[^2002], [^2006], [^CT1], [^CT2]. Previously, we mostly followed the discussion
of Ref. [^2006]. Nowadays, I also recommend the works by Scott Aaronson in [this](https://scottaaronson.com/democritus/lec9.html) and [this lecture](https://www.scottaaronson.com/barbados-2016.pdf). There is also a good [article by
Quanta-Magazine](https://www.quantamagazine.org/quantum-theory-rebuilt-from-simple-physical-principles-20170830/#)
on the whole effort to derive quantum mechanics from some simple
principles. This effort started with [this paper](https://arxiv.org/abs/quant-ph/0101012v4), which actually
makes for a nice read.

Before we start with the detailled cooking recipe let us give you some
examples of quantum systems, which are of major importance throughout
the lecture:

1.  _Orbit in an atom, molecule etc_. Most of you might have studied
    this during the introduction into quantum mechanics.

2.  _Occupation number of a photon mode_. Any person working on quantum
    optics has to understand the quantum properties of photons.

3.  _Position of an atom_ is of great importance for double slit
    experiments, the quantum simulation of condensed matter systems with
    atoms, or matterwave experiments.

4.  The _spin degree of freedom_ of an atom like in the historical
    Stern-Gerlach experiment.

5.  The classical coin-toss or bit, which connects us nicely to simple
    classical probability theory or computing

# The possible outcomes (the Hilbert Space) for the Problem in Question

The first step is to identify the right Hilbert space for your problem.
For a classical problem, we would simply list all the different possible
outcomes in a list $$(p_1, \cdots, p_N)$$ of _real_ numbers. As one of the
outcomes has to happen, we obtain the normalization condition:

```math
 \sum_i p_i = 1
```

In quantum mechanics, we follow a similar approach of first identifying
the possible outcomes. But instead of describing the outcomes with real
numbers, we now associate a complex number $$\alpha_i$$ to each outcome
$$(\alpha_1, \cdots, \alpha_N)$$, with $$\alpha_i \in \mathbb{C}$$. Given
that they should also describe some probability they have to be
normalized to one, but now we have the condition:

$$
\sum_i |\alpha_i|^2 = 1
$$

Aaronson claims that this is just measuring probabilities in in $L_2$
norm. I would highly recommend his discussions on his blog for a more
instructive derivation[@quantum]. Next we will not use the traditional
lists, but the bra-ket notation, by writing:

$$
\left|\psi\right\rangle = \sum_i \alpha_i \left|i\right\rangle
$$

And given that these are complex vectors, we will measure their overlap
through a Hermitian scalar product

$$
\langle\psi_1 \psi_2\rangle=(\langle{\psi_2}| \psi_1\rangle)^*.
$$

## The coin toss

The situation becomes particularly nice to follow for the two level
system or the coin toss. In classical systems, we will get heads up
$\uparrow$ with a certain probability p. So the inverse $\downarrow$
arrives with likelyhood $1-p$. We would then classical list the
probabilities with $(p,1-p)$. In the quantum world we achieve such a
coin for example in spin 1/2 systems or qubits in general. We will then
describe the system through the state:

$$
\left|\psi\right\rangle = \alpha_\uparrow \left|\uparrow\right\rangle + \alpha_\downarrow \left|\downarrow\right\rangle  \qquad \text{with} \; \langle\psi | \psi\rangle = 1.
$$

The next problem is how to act on the system in the classical world or
in the quantum world.

## Quantum rules

Having set up the space on which we want to act we have to follow the
rules of quantum mechanics. The informal way of describing is actually
nicely described by Chris Monroe [in this
video](https://youtu.be/CC7nlBM2cSM). We might summarize them as
follows:

1.  Quantum objects can be in several states at the same time.

2.  Rule number one only works when you are not looking.

The more methematical fashion is two say that there two ways of
manipulating quantum states:

1.  Unitary transformations $\hat{U}$.

2.  Measurements.

# Unitary transformations

As states change and evolve, we know that the total probability should
be conserved. So we transform the state by some operator $\hat{U}$,
which just maps the state
$\left|\psi\right\rangle\xrightarrow[]{U}\left|\psi'\right\rangle$.
This should not change the norm, and we obtain the condition:

$$
\left\langle\psi\right|\hat{U}^\dag\hat{U} \left|\psi\right\rangle = 1\\
\hat{U}^\dag\hat{U}  = \mathbb{1}
$$

That's the very definition of unitary operators and
unitary matrices. Going back to the case of a coin toss, we see that we
can then transform our qubit through the unitary operator:

$$
\hat{U}=\frac{1}{\sqrt{2}}\left(\begin{array}{cc}
1 & -1\\
1 & 1
\end{array}\right)
$$

Applying it on the previously defined states $\uparrow$
and $\downarrow$, we get the superposition state:

$$
\hat{U}\left|\uparrow\right\rangle = \frac{\left|\uparrow\right\rangle-\left|\downarrow\right\rangle}{\sqrt{2}}\\
\hat{U}\left|\downarrow\right\rangle = \frac{\left|\uparrow\right\rangle+\left|\downarrow\right\rangle}{\sqrt{2}}
$$

As we use the unitary matrices we also see why we might
one to use complex numbers. Imagine that we would like to do something
that is roughly the square root of the unitary, which often just means
that the system should evolve for half the time as we will see later. If
we then have negative nummbers, they will immediately become imaginary.

Such superposition would not be possible in the classical case, as
non-negative values are forbidden there. Actually, operations on
classical propability distributions are only possible if every entry of
the matrix is non-negative (probabilities are never negative right ?)
and each column adds up to one (we cannot loose something in a
transformation). Such matrices are called .

# Observables and Measurements

As much fun as it might be to manipulate a quantum state, we also have
to measure it and how it connects to the properties of the system at
hand. Any given physical quantity $A$ is associated with a Hermitian
operator $\hat{A} = \hat{A}^\dag$ acting in the Hilbert space of the
system, which we defined previously. Please, be utterly aware that those
Hermitian operators have absolutely no need to be unitary. However, any
unitary operator might be written as $\hat{U}= e^{i\hat{A}}$.

In a _measurement_ , the possible outcomes are then the eigenvalues
$a_\alpha$ of the operator $\hat{A}$:

$$
\hat{A}\left|\alpha\right\rangle=a_{\alpha}\left|\alpha\right\rangle.
$$

The system will collapse to the corresponding
eigenvector and the probability of finding the system in state
$\left|\alpha\right\rangle$ is

$$
P(\left|\alpha\right\rangle)=||\hat{P}_{\left|\alpha\right\rangle} \left|\psi\right\rangle||^2 = \left\langle\psi\right| \hat{P}^{\dag}_{\left|\alpha\right\rangle} \hat{P}_{\left|\alpha\right\rangle} \left|\psi\right\rangle,
$$

where
$\hat{P}_{\left|\alpha\right\rangle}= \left|\alpha\right\rangle \left\langle\alpha\right|$.

As for our previous examples, how would you measure them typically, i.e.
what would be the operator ?

1.  In atoms the operators will be angular moment, radius, vibrations
    etc.

2.  For the occupation number we have nowadays number counting
    photodectors.

3.  The position of an atom might be detected through high-resolution
    CCD cameras.

4.  For the _measurement of the spin_, we typically correlate the
    internal degree of freedom to the spatial degree of freedom. This is
    done by applying a magnetic field gradient acting on the magnetic
    moment $\hat{\vec{\mu}}$ , which in turn is associated with the spin
    via $\hat{\vec{\mu}} = g \mu_B \hat{\vec{s}}/\hbar$, where $g$ is
    the Landé $g$-factor and $\mu_B$ is the Bohr magneton . The energy
    of the system is $\hat{H} = -\hat{\vec{\mu}} \cdot \vec{B}$.

# Time Evolution

Being able to access the operator values and intialize the wavefunction
in some way, we also want to have a prediction on its time-evolution.
For most cases of this lecture we can simply describe the system by the
non-relativistic **Schrödinger Equation.** It reads

$$
i\hbar\partial_t\left|\psi(t)\right\rangle=\hat{H}(t)\left|\psi(t)\right\rangle.
$$

In general, the Hamilton operator $\hat{H}$ is
time-dependent. For a time-independent Hamilton operator $\hat{H}$, we
can find eigenstates $\left|\phi_n\right\rangle$ with
corresponding eigenenergies $E_n$ :

$$
\hat{H}\left|\phi_n\right\rangle=E_n\left|\phi_n\right\rangle.
$$

The eigenstates $\left|\phi_n\right\rangle$
in turn have a simple time evolution:

$$
    \left|\phi_n(t)\right\rangle=\left|\phi_n(0)\right\rangle\cdot \exp{-i E_nt/\hbar}.
$$

If we know the initial state of a system

$$
\left|\psi(0)\right\rangle=\sum_n \alpha_n\left|\phi_n\right\rangle,
$$

where $\alpha_n=\langle\phi_n | \psi(0)\rangle$, we will
know the full dimension time evolution

$$
\left|\psi(t)\right\rangle=\sum_n\alpha_n\left|\phi_n\right\rangle\exp{-i E_n t/\hbar}. \;\, \text{(Schrödinger picture)}
$$

**Note.** Sometimes it is beneficial to work in the
Heisenberg picture, which works with static ket vectors
$\left|\psi\right\rangle^{(H)}$ and incorporates the time
evolution in the operators. [^1] In certain cases one would have to have
access to relativistic dynamics, which are then described by the **Dirac
equation**. However, we will only touch on this topic very briefly, as
it directly leads us into the intruiging problems of **quantum
electrodynamics**.

## The Heisenberg picture

As mentionned in the first lecture it can benefitial to work in the
Heisenberg picture instead of the Schrödinger picture. This approach is
widely used in the field of many-body physics, as it underlies the
formalism of the second quantization. To make the connection with the
Schrödinger picture we should remember that we have the formal solution
of

$$
\left|\psi(t)\right\rangle = \mathrm{e}^{-i\hat{H}t}\left|\psi(0)\right\rangle
$$

So, if we would like to look into the expectation value
of some operator, we have:

$$
\langle\hat{A}(t)\rangle = \left\langle\psi(0)\right|\mathrm{e}^{i\hat{H}t}\hat{A}_S\mathrm{e}^{-i\hat{H}t}\left|\psi(0)\right\rangle
$$

This motivates the following definition of the operator
in the Heisenberg picture:

$$
    \hat{A}_H=\mathrm{e}^{i{\hat{H} t}/{\hbar}} \hat{A}_S \mathrm{e}^{-i{\hat{H} t}/{\hbar}}
$$

where $\exp{-i{\hat{H} t}/{\hbar}}$ is a time evolution
operator (N.B.: $\hat{H}_S = \hat{H}_H$). The time evolution of
$\hat{A}_H$ is:

$$
    \frac{d}{dt} \hat{A}_H = \frac{i}{\hbar}\hat{H}\mathrm{e}^{i{\hat{H}t}/{\hbar}}\hat{A}_S \mathrm{e}^{-i{\hat{H} t}/{\hbar}}\\
    -\frac{i}{\hbar} \mathrm{e}^{i{\hat{H} t}/{\hbar}}\hat{A}_S \mathrm{e}^{-i{\hat{H}t}/{\hbar}}\hat{H}+\partial_t \hat{A}_H\\
    = \frac{i}{\hbar}\left[\hat{H},\hat{A}_H\right] + \mathrm{e}^{i{\hat{H}t}/{\hbar}}\partial_t\hat{A}_S\mathrm{e}^{-i{\hat{H}t}/{\hbar}}
$$

**Note.** In the Heisenberg picture the state vectors
are time-independent:

$$
    \left|\psi\right\rangle_H \equiv \left|\psi(t=0)\right\rangle=\exp{i{\hat{H}}t/{\hbar}} \left|\psi(t)\right\rangle.
$$

Therefore, the results of measurements are the same in
both pictures:

$$
 \left\langle\psi(t)\right|\hat{A}\left|\psi(t)\right\rangle = \left\langle\psi\right|_H \hat{A}_H \left|\psi\right\rangle_H.
$$

[^1]:
    We will follow this route in the discussion of the two-level
    system and the Bloch sphere.

[^2002]: Dalibard Basdevant. Quantum Mechanics. Springer-Verlag, 2002

[^2006]: Jean Dalibard Jean-Louis Basdevant. The Quantum Mechanics Solver. Springer-Verlag, 2006.

[^CT1]: Quantum Mechanics, Volume 1.

[^CT2]: Quantum Mechanics, Volume 2.
