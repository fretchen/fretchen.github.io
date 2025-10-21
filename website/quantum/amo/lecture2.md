---
author:
  - Fred Jendrzejewski
  - Selim Jochim
order: 2
title: Lecture 2 - A few more cooking recipes for quantum mechanics
---

In this second lecture we will finish the discussion of the basic
cooking recipes and discuss a few of the consequences like the
uncertainty relation, the existance of wave packages and the Ehrenfest
theorem.

In the first lecture we discussed briefly the basic
principles of quantum mechanics like operators, state vectors and the
Schrödinger equation. We will finish this discussion today and then
introduce the most important consequences. We will continue to closely
follow the discussion of the introductory chapter of Ref. [^2006]

## Composite systems

It is actually quite rare that we can label the system with a single
quantum number. Any atom will involve spin, position, angular momentum.
Other examples might just involve two spin which we observe. So the
question is then on how we label those systems. We then have two
questions to answer:

1.  How many labels do we need for a system to fully determine its
    quantum state ?

2.  Once I know all the labels, how do I construct the full state out of
    them ?

We will actually discuss the second question first as it sets the
notation for the first question.

### Entangled States

In AMO we typically would like to characterize is the state of an
electron in a hydrogen atom. We need to define its angular momentum
label $L$, which might be 0, 1, 2 and also its electron spin $S$, which
might be $\{\uparrow, \downarrow\}$. It state is then typically labelled
as something like

$$\left|L=0, S=\uparrow\right\rangle = \left|0,\uparrow\right\rangle$$

etc.

Another, simple example is that of two spins, each one having two
possible states $\{\uparrow, \downarrow\}$. This is a standard problem
in optical communication, where you send correlated photons with a
certain polarization to different people. We will typically call them
Alice and Bob [^1].

We now would like to understand than if we can disentangle the
information about the different labels. Naively, we can now associate
with Alice one set of outcomes and describe it by some state
$\left|\psi_{A}\right\rangle$ and the Bob has another set
$\left|\psi_{B}\right\rangle$:

$$
\left|\psi_A\right\rangle= a_{\uparrow} \left|\uparrow_A\right\rangle+ a_{\downarrow} \left|\downarrow_A\right\rangle\\
\left|\psi_B\right\rangle= b_{\uparrow} \left|\uparrow_B\right\rangle+ b_{\downarrow} \left|\downarrow_B\right\rangle
$$

The full state will then be described by the possible outcomes
$\{\uparrow_A\uparrow_B,\downarrow_A\uparrow_B,\uparrow_A\downarrow_B, \downarrow_A\downarrow_B\}$.
We can then write:

$$
\left|\psi\right\rangle = \alpha_{\uparrow\uparrow}(\left|\uparrow_A\right\rangle\otimes\left|\uparrow_B\right\rangle)+\alpha_{\uparrow\downarrow}(\left|\uparrow_A\right\rangle\otimes\left|\downarrow_B\right\rangle)+\alpha_{\downarrow\uparrow}(\left|\downarrow_A\right\rangle\otimes\left|\uparrow_B\right\rangle)+\alpha_{\downarrow\downarrow}(\left|\downarrow_A\right\rangle\otimes\left|\downarrow_B\right\rangle)\\
= \alpha_{\uparrow\uparrow}\left|\uparrow\uparrow\right\rangle+\alpha_{\uparrow\downarrow}\left|\uparrow\downarrow\right\rangle+\alpha_{\downarrow\uparrow}\left|\downarrow \uparrow\right\rangle+\alpha_{\downarrow\downarrow}\left|\downarrow\downarrow\right\rangle
$$

So we will typically just plug the labels into a single
ket and drop indices, to avoid rewriting the tensor symbol each time. We
say that a state is _separable_, if we can write it as a product of the
two individual states as above:

$$
\left|\psi\right\rangle = \left|\psi_A\right\rangle\otimes\left|\psi_B\right\rangle\\
=a_{\uparrow} b_\uparrow \left|\uparrow\uparrow\right\rangle+a_{\downarrow} b_\uparrow \left|\downarrow\uparrow\right\rangle+a_{\uparrow} b_\downarrow \left|\uparrow\downarrow\right\rangle+a_{\downarrow} b_\downarrow \left|\downarrow\downarrow\right\rangle
$$

All other states are called _entangled_. The most famous entangled
states are the Bell states:

$$
\left|\psi_\textrm{Bell}\right\rangle=\frac{\left|\uparrow\uparrow\right\rangle+\left|\downarrow\downarrow\right\rangle}{\sqrt{2}}
$$

In general we will say that the quantum system is formed by two
subsystems $S_1$ and $S_2$. If they are independent we can write each of
them as:

$$
\left|\psi_1\right\rangle=\sum_m^M a_m \left|\alpha_m\right\rangle,\\
\left|\psi_2\right\rangle=\sum_n^N b_n \left|\beta_n\right\rangle.
$$

In general we will then write:

$$
\left|\psi\right\rangle=\sum_m^M \sum_n^N c_{mn}(\left|\alpha_m\right\rangle\otimes \left|\beta_n\right\rangle).
$$

So we can determine such a state by $M \times N$ numbers
$c_{mn}$ here. If the states are _separable_, we can write
$\left|\psi\right\rangle$ as a product of the individual
states:

$$
\left|\psi\right\rangle=\left|\psi_1\right\rangle\otimes\left|\psi_2\right\rangle=\left(\sum_m^M a_m \left|\alpha_m\right\rangle\right) \otimes \left(\sum_n^N b_n \left|\beta_n\right\rangle\right)
$$

$$
\left|\psi\right\rangle=\sum_m^M \sum_n^N a_m b_n \left|\alpha_m\right\rangle \otimes \left|\beta_n\right\rangle.
$$

Separable states thus only describes a small subset of all possible
states.

## Statistical Mixtures and Density Operator

Having set up the formalism for writing down the full quantum state with
plenty of labels, we have to solve the next problem. As an
experimentalist, you will rarely measure all of them. This means that
you only perform a partial measurement and you have only partial
information of the system. The extreme case is the thermodynamic
ensemble, where we measure only temperature to describe $10^{23}$
particles.

A similiar problem arises for Alice and Bob. They typically measure the
state of the qubit in their lab without knowing what the other did. So
they need some way to describe the system locally. This is done through
the density operator approach.

In the density operator approach the state of the system is described by
a Hermitian density operator

$$
 \hat{\rho} = \sum_{n=1}^N p_n \left|\phi_n\right\rangle\left\langle\phi_n\right|.
$$

Here, $\left\langle\phi_n\right|$ are the
eigenstates of $\hat{\rho}$, and $p_n$ are the probabilities to find the
system in the respective states
$\left|\phi_n\right\rangle$. The trace of the density
operator is the sum of all probabilities $p_n$:

$$
  \mathrm{tr}(\hat{\rho}) = \sum p_n = 1.
$$

For a pure state $\left|\psi\right\rangle$, we get $p_n=1$
for only one value of $n$. For every other $n$, the probabilities
vanish. We thus obtain a "pure" density operator
$\hat{\rho}_{\text{pure}}$ which has the properties of a projection
operator:

$$
\hat{\rho}_{\text{pure}} = \left|\psi\right\rangle\left\langle\psi\right| \qquad \Longleftrightarrow \qquad \hat{\rho}^2 = \hat{\rho}.
$$

For the simple qubit we then have:

$$
\hat{\rho}= \left(\alpha_\uparrow\left|\uparrow\right\rangle+\alpha_\downarrow\left|\downarrow\right\rangle\right)\left(\alpha_\uparrow^*\left\langle\uparrow\right|+\alpha_\downarrow^*\left\langle\downarrow\right|\right)\\
  = |\alpha_\uparrow|^2\left|\uparrow\right\rangle\left\langle\uparrow\right|+|\alpha_\downarrow|^2\left|\downarrow\right\rangle\left\langle\downarrow\right|+\alpha_\downarrow\alpha_\uparrow^*\left|\downarrow\right\rangle\left\langle\uparrow\right|+\alpha_\uparrow\alpha_\downarrow^*\left|\uparrow\right\rangle\left\langle\downarrow\right|
$$

Then it is even simpler to write in matrix form:

$$
  \hat{\rho}= \left(\begin{array}{cc}
  |\alpha_\uparrow|^2&\alpha_\uparrow\alpha_\downarrow^*\\
  \alpha_\downarrow\alpha_\uparrow^*&|\alpha_\downarrow|^2
  \end{array}\right)
$$

For a thermal state on the other hand we have:

$$
\hat{\rho}_{\text{thermal}} = \sum_{n=1}^N \frac{e^{-\frac{E_n}{k_BT}}}{Z} \left|\phi_n\right\rangle\left\langle\phi_n\right|\text{ with }Z = \sum_{n=1}^N e^{-\frac{E_n}{k_BT}}
$$

With this knowledge we can now determine the result of a
measurement of an observable $A$ belonging to an operator $\hat{A}$. For
the pure state $\left|\psi\right\rangle$ we get:

$$
\langle \hat{A}\rangle = \left\langle\psi\right| \hat{A} \left|\psi\right\rangle.
$$

For a mixed state we get:

$$
\langle \hat{A}\rangle = \mathrm{tr}(\hat{\rho}\cdot \hat{A}) = \sum_n {p_n} \left\langle\phi_n\right| \hat{A} \left|\phi_n\right\rangle.
$$

The time evolution of the density operator can be
expressed with the von Neumann equation:

$$
i\hbar \partial_{t}\hat{\rho}(t) = [\hat{H}(t),\hat{\rho}(t)].
$$

### Back to partial measurements

We can now come back to the correlated photons sent to Alice and Bob,
sharing a Bell pair. They full density matrix is then especially simple:

$$
  \hat{\rho}= \left(\begin{array}{cccc}
  \frac{1}{2}& 0& 0 &\frac{1}{2}\\
  0 & 0 & 0& 0\\
  0&0&0&0\\
    \frac{1}{2}&0&0&\frac{1}{2}
  \end{array}\right)
$$

Let us write the system as $S = S_A \otimes S_B$. If we are looking for
the density operator $\hat{\rho}_i$ of each individual, we can simply
write:

$$
\hat{\rho}_A=\mathrm{tr}_{B}(\hat{\rho}),\\
\hat{\rho}_B=\mathrm{tr}_{A}(\hat{\rho}),
$$

where
$\hat{\rho}=\left|\psi\right\rangle\left\langle\psi\right|$
and $\mathrm{tr}_{j}(\hat{\rho})$ is the trace over the Hilbert space of
subsystem $j$.

To reduce the density matrix of the Bell state it is actually helpful to
write out the definitions:

$$
\mathrm{tr}_{B}(\hat{\rho}) = \left\langle\uparrow_B\right|\hat{\rho}\left|\uparrow_B\right\rangle+\left\langle\downarrow_B\right|\hat{\rho}\left|\downarrow_B\right\rangle\\
=\frac{1}{2}\left(\left|\uparrow_A\right\rangle\left\langle\uparrow_A\right|+\left|\downarrow_A\right\rangle\left\langle\downarrow_A\right|\right)
$$

So we end up with the fully mixed state:

$$
  \hat{\rho}_{A,B} = \left(\begin{array}{cc}
  \frac{1}{2}&0\\
  0&\frac{1}{2}
  \end{array}\right)
$$

Alice and Bob are simply cossing a coin if they ignore
the outcome of the other member. But once they start comparing results
we will see that the quantum case can dramatically differ from the
classical case. This will be the content of lecture 12 [@entanglement].

## Important Consequences of the Principles

### Uncertainty Relation

The product of the variances o two noncommuting operators has a lower
limit:

$$
    \Delta \hat{A} \cdot \Delta \hat{B} \geq \frac{1}{2} \left| \left\langle\left[\hat{A,\hat{B}}\right]\right\rangle \right|,
$$

where the variance is defined as
$\Delta \hat{A} = \sqrt{\left\langle\hat{A^2}\right\rangle-\left\langle\hat{A}^2\right\rangle}$.

**Examples.**

$$
\left[ \hat{x}, \hat{p} \right] = i \hbar \\
\left[ \hat{J}_i , \hat{J}_j \right] = i \hbar \epsilon_{ijk} \hat{J}_k
$$

**Note.** This is a statement about the _state_ itself, and not the
measurement!

### Ehrenfest Theorem

With the Ehrenfest theorem, one can determine the time evolution of the
expectation value of an operator $\hat{A}$:

$$
 \frac{d}{dt}\left\langle\hat{A}\right\rangle=\frac{1}{i\hbar}\left\langle\left[\hat{A},\hat{H}\right]\right\rangle+\left\langle\partial_t\hat{A}(t)\right\rangle.
$$

If $\hat{A}$ is time-independent and
$\left[\hat{A},\hat{H}\right]=0$, the expectation value
$\left\langle\hat{A}\right\rangle$ is a constant of the
motion.

### Complete Set of Commuting Observables

A set of commuting operators
$\{\hat{A},\hat{B},\hat{C},\cdots,\hat{X}\}$ is considered a complete
set if their common eigenbasis is unique. Thus, the measurement of all
quantities $\{A,B,\cdots,X\}$ will determine the system uniquely. The
clean identification of such a Hilbert space can be quite challenging
and a nice way of its measurment even more. Coming back to our previous
examples:

1.  Performing the full spectroscopy of the atom. Even for the hydrogen
    atom we will see that the full answer can be rather involved\...

2.  The occupation number is rather straight forward. However, we have
    to be careful that we really collect a substantial amount of the
    photons etc.

3.  Are we able to measure the full position information ? What is the
    resolution of the detector and the point-spread function ?

4.  Here it is again rather clean to put a very efficient detector at
    the output of the two arms \...

5.  What are the components of the spin that we can access ? The $z$
    component does not commute with the other components, so what should
    we measure ?

In the [third
lecture](https://www.authorea.com/326444/GsbfEypTdf4dvncV23L8_Q) of this
course will start to apply these discussions to the two-level system,
which is one of the simplest yet most powerful models of quantum
mechanics.

[^1]: And if someone wants to listen the person is called Eve

[^2006]: Jean Dalibard Jean-Louis Basdevant. The Quantum Mechanics Solver. Springer-Verlag, 2006.
