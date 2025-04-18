---
author:
  - Fred Jendrzejewski
  - Selim Jochim
order: 4
title: Lecture 4 - Atoms in oscillating fields
---

In the lecture, we will see how a time dependent coupling allows us to
engineer a new Hamiltonian. Most importantly, we will discuss the
resonant coupling of two levels and the decay of a single level to a
continuum.

In the last lecture, we discussed the properties of two
coupled levels. However, we did not elaborate at any stage how such a
system might emerge in a true atom. Two fundamental questions come to
mind:

1.  How is it that a laser allows to treat two atomic levels of very
    different energies as if they were degenerate ?

2.  An atom has many energy levels $E_n$ and most of them are not
    degenerate. How can we reduce this complicated structure to a
    two-level system?

The solution is to resonantly couple two of the atom's levels by
applying an external, oscillatory field, which is very nicely discussed
in chapter 12 of Ref. [^2002] [^Cohen_Tannoudji_1998]. We will discuss
important and fundamental properties of systems with a time-dependent
Hamiltonian.

We will discuss a simple model for the atom in the oscillatory field. We
can write down the Hamiltonian:

$$
 \hat{H} = \hat{H}_0 + \hat{V}(t).
$$

Here, $\hat{H}_0$ belongs to the atom and $V(t)$
describes the time-dependent field and its interaction with the atom. We
assume that $\left|n\right\rangle$ is an eigenstate of
$\hat{H}_0$ and write:

$$
\hat{H}_0\left|n\right\rangle = E_n \left|n\right\rangle.
$$

If the system is initially prepared in the state
$\left|i\right\rangle$, so that

$$
\left|\psi(t=0)\right\rangle = \left|i\right\rangle,
$$

what is the probability

$$
P_m(t) = \left|\left\langle m|\psi(t)\right\rangle\right|^2
$$

to find the system in the state
$\left|m\right\rangle$ at the time $t$?

## Evolution Equation

The system $\left|\psi(t)\right\rangle$ can be expressed as
follows:

$$
\left|\psi(t)\right\rangle = \sum_n \gamma_n(t) \mathrm{e}^{-i{E_n}t/{\hbar}} \left|n\right\rangle,
$$

where the exponential is the time evolution for
$\hat{H}_1 =~0$. We plug this equation in the Schrödinger equation and
get:

$$
i\hbar \sum_n\left(\dot{\gamma}_n(t)-i\frac{E_n}{\hbar}\gamma_n(t)\right)\mathrm{e}^{-i{E_n}t/{\hbar}}\left|n\right\rangle = \sum_n \gamma_n(t) \mathrm{e}^{-i{E_n}t/{\hbar}}\left(\hat{H}_0 + \hat{V}\right) \left|n\right\rangle\\
\Longleftrightarrow i\hbar\sum_n \dot{\gamma}_n(t) \mathrm{e}^{-i{E_n}t/{\hbar}} \left|n\right\rangle
 = \sum_n \gamma_n(t) \mathrm{e}^{-i{E_n}t/{\hbar}} \hat{V} \left|n\right\rangle
$$

If we multiply the equation with $\left\langle k\right|$ we
obtain a set of coupled differential equations

$$
i\hbar \dot{\gamma}_k \mathrm{e}^{-i{E_k}t/{\hbar}} = \sum_n \gamma_n \mathrm{e}^{-{E_n}t/{\hbar}}\left\langle k\right|\hat{V}\left|n\right\rangle,\\
i\hbar \dot{\gamma}_k = \sum_n \gamma_n \mathrm{e}^{-i {(E_n-E_k)}t/{\hbar}} \left\langle k\right| \hat{V}\left|n\right\rangle
$$

with initial conditions
$\left|\psi(t=0)\right\rangle$. They determine the full
time evolution.

The solution of this set of equations depends on the details of the
system. However, there are a few important points:

- For short enough times, the dynamics are driving by the coupling
  strength
  $\left\langle k\right|\hat{V} \left|n\right\rangle$.

- The right-hand sight will oscillate on time scales of $E_n-E_k$ and
  typically average to zero for long times.

- If the coupling element is an oscillating field
  $\propto e^{i\omega_L t}$, it might put certain times on resonance
  and allow us to avoid the averaging effect. It is exactly this
  effect, which allows us to isolate specific transitions to a very
  high degree [^1]

We will now see how the two-state system emerges from these
approximations and then set-up the perturbative treatment step-by-step.

## Rotating wave approximation

We will now assume that the coupling term in indeed an oscillating field
with frequency $\omega_L$, so it reads:

$$
\hat{V} = \hat{V}_0 \cos(\omega_Lt) = \frac{\hat{V}_0}{2} \left(e^{i\omega_lt}+e^{-i\omega_lt}\right)
$$

We will further assume the we would like use it to
isolate the transition $i\rightarrow f$, which is of frequency
$\hbar \omega_0 = E_f - E_i$. The relevant quantity is then the detuning
$\delta = \omega_0 - \omega_L$. If it is much smaller than any other
energy difference $E_n-E_i$, we directly reduce the system to the
following closed system:

$$
i\dot{\gamma}_i = \gamma_f \mathrm{e}^{-i \delta t} \Omega\\
i\dot{\gamma}_f = \gamma_i \mathrm{e}^{i \delta t}\Omega^*
$$

Here we defined
$\Omega = \left\langle i\right| \frac{\hat{V_0}}{2\hbar}\left|f\right\rangle$.
And to make it really a time-of the same form as the two-level system
from the last lecture, we perform the transformation
$\gamma_f = \tilde{\gamma}_f e^{i\delta t}$, which reduces the system
too:

$$
i \dot{\gamma}_i = \Omega \tilde{\gamma}_f \\
i\dot{\tilde{\gamma}}_f = \delta \tilde{\gamma}_f + \Omega^* \gamma_i
$$

This has exactly the form of the two-level system that
we studied previously.

### Adiabatic elimination

We can now proceed to the quite important case of far detuning, where
$\delta \gg \Omega$. In this case, the final state
$\left|f\right\rangle$ gets barely populated and the time
evolution can be approximated to to be zero [@lukin].

$$
\dot{\tilde{\gamma}}_f = 0
$$

We can use this equation to eliminate $\gamma$ from the
time evolution of the ground state. This approximation is known as
_adiabatic elimination_:

$$
\tilde{\gamma}_f = \frac{\Omega^*}{\delta}\gamma_i\\
\Rightarrow i\hbar \dot{\gamma}_i = \frac{|\Omega|^2}{\delta} \tilde{\gamma}_i
$$

The last equation described the evolution of the initial
state with an energy $E_i = \frac{|\Omega|^2}{\delta}$. If the Rabi
coupling is created through an oscillating electric field, i.e. a laser,
this is know as the **light shift** or the **optical dipole potential**.
It is this concept that underlies the optical tweezer for which Arthur
Ashkin got the [nobel prize in the 2018](https://www.nobelprize.org/uploads/2018/10/advanced-physicsprize2018.pdf).

### Example: Atomic clocks in optical tweezers

A neat example that ties the previous concepts together is [the recent
paper](https://arxiv.org/abs/1908.05619v2). The experimental setup is visualized in the figure below.

<img src="./lecture4_pic1.png" width="90%">

While nice examples these clocks are still far away from the best clocks
out there, which are based on [optical lattice clocks and ions](http://dx.doi.org/10.1103/revmodphys.87.637).

## Perturbative Solution

The more formal student might wonder at which points all these rather
hefty approximation are actually valid, which is obviously a very
substantial question. So, we will now try to isolate the most important
contributions to the complicated system through perturbation theory. For
that we will assume that we can write:

$$
\hat{V}(t) =\lambda \hat{H}_1(t)
$$

, where $\lambda$ is a small parameter. In other words
we assume that the initial system $\hat{H}_0$ is only weakly perturbed.
Having identified the small parameter $\lambda$, we make the
_perturbative ansatz_

$$
    \gamma_n(t) = \gamma_n^{(0)} + \lambda \gamma_n^{(1)} + \lambda^2 \gamma_n^{(2)} + \cdots
$$

and plug this ansatz in the evolution equations and sort
them by terms of equal power in $\lambda$.

The $0$th order reads

$$
 i\hbar \dot{\gamma}_k^{(0)} = 0.
$$

The $0$th order does not have a time evolution since we
prepared it in an eigenstate of $\hat{H}_0$. Any evolution arises due
the coupling, which is at least of order $\lambda$.

So, for the $1$st order we get

$$

i\hbar \dot{\gamma}_k^{(1)} = \sum_n \gamma_n^{(0)} \mathrm{e}^{-i(E_n-E_k)t/{\hbar}}\left\langle k\right|\hat{H}_1\left|n\right\rangle.
$$

### First Order Solution (Born Approximation)

For the initial conditions $\psi(t=0)=\left|i\right\rangle$
we get

$$
\gamma_k^{(0)}(t) = \delta_{ik}.
$$

We plug this in the $1$st order approximation and obtain the rate for the system to go
to the final state $\left|f\right\rangle$:

$$
i \hbar\dot{\gamma}^{(1)} = \mathrm{e}^{i(E_f-E_i)t/{\hbar}} \left\langle f\right|\hat{H}_1 \left|i\right\rangle
$$

Integration with $\gamma_f^{(1)}(t=0) = 0$ yields

$$

\gamma_f^{(1)} = \frac{1}{i\hbar}\int\limits_0^t \mathrm{e}^{i(E_f-E_i)t'/{\hbar}} \left\langle f\right| \hat{H}_1(t')\left|i\right\rangle \mathop{}\!\mathrm{d}t',
$$

so that we obtain the probability for ending up in the
final state:

$$
P_{i\to f}(t) = \lambda^2\left| \gamma_f^{(1)}(t)\right|^2.
$$

Note that $P_{i\to f}(t) \ll 1$ is the condition for
this approximation to be valid!

**Example 1: Constant Perturbation.**

<img src="./lecture4_pic2.png" width="90%">

Sketch of a constant perturbation.

We apply a constant perturbation in the time interval
$\left[0,T\right]$, as shown in above. If we use the expression for $\gamma_f^{(1)}$ and set $\hbar \omega_0 = E_f-E_i$, we get

$$
\gamma_f^{(1)}(t\geq T) = \frac{1}{i \hbar} \left\langle f\right|\hat{H}_1\left|i\right\rangle \frac{\mathrm{e}^{i\omega_0 T}-1}{i\omega_0},
$$

and therefore

$$
P_{i\to f} = \frac{1}{\hbar^2}\left|\left\langle f\right|\hat{V}\left|i\right\rangle\right|^2 \underbrace{\frac{\sin^2\left(\omega_0\frac{T}{2}\right)}{\left(\frac{\omega_0}{2}\right)^2}}_{\mathrm{y}(\omega_0,T)}.
$$

A sketch of $\mathrm{y}(\omega_0,T)$ is shown below

<img src="./lecture4_pic3.png" width="90%">

A sketch of y

We can push this calculation to the extreme case of
$T\rightarrow \infty$. This results in a delta function, which is peaked
round $\omega_0 = 0$ and we can write:

$$
P_{i\to f} =  T\frac{2\pi}{\hbar^2}\left|\left\langle f\right|\hat{V}\left|i\right\rangle\right|^2\delta(\omega_0)
$$

This is the celebrated **Fermi's golden rule**.

**Example 2: Sinusoidal Perturbation.** For the perturbation

$$
\hat{H}_1(t) = \left\{ \begin{array}{ccl} \hat{H}_1\mathrm{e}^{-i\omega t} && \text{for}\; 0 < t < T \\ 0 &&\text{otherwise}\end{array} \right.
$$

we obtain the probability

$$
P_{i\to f} (t \geq T) = \frac{1}{\hbar^2} \left|\left\langle f\right|\hat{V}\left|i\right\rangle\right|^2 \mathrm{y}(\omega_0 - \omega, T).
$$

At $\omega = \left|E_f - E_i\right|/\hbar$ we are on resonance.

In the fifth lecture, we will start to dive into the hydrogen atom.

[^1]:
    This is the idea behind atomic and optical clocks, which work
    nowadays at $10^{-18}$.

[^2002]: Jean Dalibard Jean-Louis Basdevant. Quantum Mechanics. Springer-Verlag, 2002.

[^Cohen_Tannoudji_1998]: Claude Cohen-Tannoudji, Jacques Dupont-Roc, Gilbert Grynberg. Atom-Photon Interactions. Wiley-VCH Verlag GmbH, 1998.
