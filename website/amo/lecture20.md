---
author:
  - Fred Jendrzejewski
order: 20
title: Lecture 20 - A few words on quantum computing with trapped ions
---

In this lecture we are going to discuss the fundamental ingredients for
quantum computing with trapped ions. In a first step, we discuss
trapping and cooling, then single qubit operations and finally two-qubit
operations.

Quantum computation has become a branch of research at the interaction
of physics, engineering, mathematices and computer science by now. The
standard book on the topic is most likely the book by Nielsen and Chang
[Nielsen 2009](http://dx.doi.org/10.1017/cbo9780511976667). However, an enormous amount of additional literature
exists, I will only reference here to [a nice introduction](https://arxiv.org/abs/1804.03719v1) a
more complete list is left for future discussions.

In this lecture we will discuss shortly the idea behind quantum
computing and the discuss its implementation on trapped ions. While a
large number of them exist, we decided to start with trapped ions for
several very subjective reasons [^1].

And before we can start the discussion we would highly recommend the
readers to take some time to go through the Nobel prize lecture of Dave
Wineland as it gives a detailled discussion of the field from his point
of view [Wineland 2013](http://dx.doi.org/10.1103/revmodphys.85.1103).

# What do we want from a QC ?

In a QC we would like to implement algorithms, which are based on well
defined operations. Influential examples of such algorithms are the
quantum Fourier transform and the Grover algorithm.

Given that computations are typically implemented through logical truth
tables, we typically base a quantum computer on qubits. We then call one
state $\left|0\right\rangle$ and on
$\left|1\right\rangle$. Given that we would like to have
reproducable computations, we always assume that we start them out with
all qubits in the $\left|0\right\rangle$ state.

A computation consists then in applying a number of gates. The key is
here that any algorithm might be built up from an extremely limited
number of gates. Typically four are sufficient:

- The three gates that rotate each individual qubit on the Bloch
  sphere.

- A gate that entangles them properly. The standard example is here
  the CNOT gate, which we will come back too.

Such computations are then typically nicely visualized through circuit
diagrams as used them already for the study of Bell inequalities and
visualized below.

<figure id="fig-circuit">
<img src="./lecture20_pic1.png" width="60%" />
<figcaption>A simple circuit diagram. It show the initial state, an entanglement
gate, a number of single qubit gates and the final readout.</figcaption>
</figure>

As atomic physics is only a minor part of the QC field, we typically
have to learn the new notations of the field again. As such single qubit
gates are typically not explained through the Pauli matrices but by
different symbols like $H$ or $Z$. We come back to this later.

## Some of the hopes for QCs

The major point to about a properly chosen set of gates is that it
allows us to implement ANY algorithm. So they allow us to implement a
_universal_ quantum computer. The main question is then how powerful
such a QC would be. Could it solve problems as fast a a classical
computer or maybe even faster ? This question is at the hard of the
field of complexity classes, which studies which kind of problem can be
solved [how efficiently](https://complexityzoo.uwaterloo.ca/Petting_Zoo).

The most fundamental question is then if a problem can be solved in a
polynomial time (P hard) or not (NP-hard). Linear problems are P-hard
and the travelling salesman problem is NP-hard. For some problems a
quantum computer might then provide an answer in polynomial time, where
a classical computer would not\... The factorization of prime numbers is
one of these problems as discussed in Shor algorithm.

And the google paper that was published in 2019 actually indicated for
the first time that a quantum computer achieved such a task
[Arute 2019](http://dx.doi.org/10.1038/s41586-019-1666-5).

## Requirements for a QC

Given our excitement for a quantum computer, we might want a checklist
of what we want from a quantum computer hardware. DiVincenzo proposed
[the following ingredients](http://dx.doi.org/10.1016/j.physrep.2008.09.003):

1.  Qubits that can store information in a scalable system.

2.  The ability to initialize the system in the right state.

3.  A universal set of gates.

4.  Long coherence times, which are much longer than gate operation
    times.

5.  Good measurement capabilities

Trapped ions allow us to fulfill all these requirements as we will see
in this lecture and we will go through them step-by-step.

# Trapping and cooling

For computing experiments one typically works with singe-charged ions
like $^{40}Ca^+$. Given their charge, they can be trapped in very clean
traps under vacuum. As such they are extremely well isolated from the
environment and high precision experiments can be performed. Finally,
they have only one remain electron in the outer shell. Therefore they
have a hydrogenlike atomic structure.

However, the trap construction is not trivial given Maxwells equation
$\text{div} \vec{E} = 0$. So, the experimentalists have to play some
tricks with oscillating fields. We will not derive in detail how a
resulting **Paul trap** works, but the [linked
video](https://youtu.be/Xb-zpM0UOzk) gives a very nice impression of the
idea behind it.

This work on trapping ions dates back to the middle of the last century
(!!!) and was recognized by the[ Nobel prize in
1989](https://www.nobelprize.org/prizes/physics/1989/summary/) for
[Wolfgang Paul](http://dx.doi.org/10.1103/revmodphys.62.531) and [Hans Dehmelt](http://dx.doi.org/10.1103/revmodphys.62.525). They shared
the prize with Norman Ramsey, who developped extremely precise
spectroscopic methods, now known as [Ramsey spectroscopy](http://dx.doi.org/10.1103/revmodphys.62.541).

<figure id="fig-paul">
<img src="./lecture20_pic2.png" width="60%" />
<figcaption>The two phases of the oscillating electric field of a Paul trap. Taken
from <a href="https://en.wikipedia.org/wiki/Quadrupole_ion_trap">wikipedia</a>.</figcaption>
</figure>

<figure id="fig-paul-exp">
<img src="./lecture20_pic3.png" width="60%" />
<figcaption>A linear ion (Paul) trap containing six calcium 40 ions. Taken
from <a href="https://quantumoptics.at/en/research/lintrap.html">here</a>.</figcaption>
</figure>

A Paul trap provides a harmonic oscillator confinement with trapping
frequencies in the order of hundreds of kHz. An ion trapped in such a
trap can the be described by the Hamiltonian:

$$

\hat{H}_{t} = \frac{\hat{p}^2}{2m}+ \frac{m\omega_t^2}{2}\hat{x}^2
$$

The two variables $p$ and $x$ are non-commuting $[x, p] = i\hbar$, so
they cannot be measured at the same time. It can be nicely diagonalized
in terms of the ladder operators:

$$
\hat{x} = \sqrt{\frac{\hbar}{2m\omega_t}}\left(\hat{a}+\hat{a}^\dag\right)\\
\hat{p} = i\sqrt{\frac{\hbar}{2m\omega_t}}\left(\hat{a}^\dag-\hat{a}\right)\\
$$

So the Hamiltonian can now be written as:

$$
\hat{H} = \hbar \omega_t \left(\hat{N} + \frac{1}{2}\right)\text{ with } \hat{N} = a^\dag a
$$

Having loaded the ions into the Paul trap we also need
to cool them down.

# Atom-light interaction

Given that the ions keep only on atom on the outer shell, they have a
hydrogenlike structure, which makes
them optically well controllable. To control the ions further we use
light of amplitude $E_0$ and frequency $\omega_L$:

$$
\vec{E}(t) = \vec{E}_0 \cos(kx - \omega_L t+\varphi)\\
= \frac{\vec{E}_0}{2} \left(e^{i[kx - \omega_lt+\varphi]}+e^{-i[kx-\omega_lt+\varphi]}\right)
$$

We will describe the interal states of the ion for the
moment with the simple two state system of ground state
$\left|g\right\rangle$ and excited state
$\left|e\right\rangle$ at an energy $\hbar \omega_0$, which
is typically in the order of thousands of THz. It has the Hamiltonian:

$$
H_{ion} = \hbar \omega_0 \left|e\right\rangle\left\langle e\right|
$$

Putting this ion into propagating light will induce a
coupling between these two internal states. As previously , we will
describe the coupling in the semi-classical approximation through
$H_\textrm{int} = -\hat{\vec{D}} \cdot \vec{E}$. However, in this
context we will not ignore the propagating nature of the light field and
keep its position dependence. This is necessary as we would like to
understand how the light influences the movement of the atoms and not
only the internal states. Putting them together we obtain:

$$
H_\textrm{int} = \frac{\Omega}{2}\left([\left|g\right\rangle\left\langle e\right|+\left|e\right\rangle\left\langle g\right|]e^{i(k \hat{x} - \omega_L t+\varphi)} + h.c.\right)
$$

The laser frequency is tuned closely to the frequency of
the internal state transition and we will be only interested in the
detuning $\Delta = \omega_0 - \omega_L$. Importantly, it couples the
position of the atom and the internal states.

To simplify the problem, we can work in the rotating frame to describe
the external and internal degrees of freedom for the ion:

$$

\hat{H}= \hbar \omega_t \hat{a}^\dag \hat{a} + \hbar\Delta \left|e\right\rangle\left\langle e\right| + \frac{\Omega}{2}\left(\left|e\right\rangle\left\langle g\right|e^{i\left(k \hat{x}+\varphi\right)} + h.c.\right)
$$

We will now see how this system is used to cool the ions to the motional
groundstate, perform single qubit operations and then two-qubit
operations.

# Doppler cooling

This interaction of the atom with a photon is at the origin of the
all-important Laser cooling, which was pioneered for ions in the 1970s
(!!) by the Wineland group. For cooling transition we couple the ground
state to an excited state of finitie lifetime $\tau= \frac{1}{\Gamma}$.

<figure id="fig-laser-cooling">
<img src="./lecture20_pic2.png" width="60%" />
</figure>

The basic idea of laser cooling. The incoming light gives the ion a
momentum kick $\vec{k}_{in}$. The photon is reemitted in a random
direction such that $<\vec{k}_{out}>=0$.

This laser cooling had a tremendous impact on the field of atomic
physics in general. Notably it gave rise to the field of cold atoms to
which we will get back in the next lecture. This importance was
recognized in the Nobel prizes of 1997 for [Steve Chu](http://dx.doi.org/10.1103/revmodphys.70.685), [Claude
Cohen-Tannoudji](http://dx.doi.org/10.1103/revmodphys.70.707) and [Bill Phillips](http://dx.doi.org/10.1103/revmodphys.70.721).

## Working in the Lamb-Dicke regime

After this initial cooling stage the atoms have to be cooled to the
ground state in the trap. To treat the trapped particles we will express
the position operator in terms of the ladder operator, such that:

$$
k\hat{x} = \eta (\hat{a}^\dag+ \hat{a})\\
\eta = \sqrt{\frac{\hbar^2 k^2/2m}{\hbar \omega_t}} =\sqrt{\frac{E_R}{\hbar \omega_t}}
$$

$\eta$ is called the _Lamb-Dicke_ parameter. It compares
the change in motional energy due to the absorption of the photon
$E_r = \frac{(\hbar k)^2}{2m}$ compared to the energy spacing
$\hbar \omega_t$ in the trap. When it is small it suppresses the change
of the motional state of the atom due to the absorption of a photon.

For simplicity we will set in this section $\varphi=0$ and develop the
exponent to obtain:

$$
H_\textrm{int} = \frac{\Omega}{2}\left(\left|e\right\rangle\left\langle g\right|\left(1 + i\eta[\hat{a}^\dag+ \hat{a}]\right) + h.c.\right)
$$

So it contains three couplings for different trap levels
and internal states:

- The _carrier_ transition
  $\left|g,n\right\rangle\rightarrow \left|e,n\right\rangle$
  with strength $\Omega$.

- The _red_ sideband
  $\left|g,n\right\rangle\rightarrow \left|e,n-1\right\rangle$
  with strength $\eta \Omega(n+1)$. It leads to a reduction of the
  trap level and it is resonant for $\Delta = -\omega_t$.

- The _blue_ sideband
  $\left|g,n\right\rangle\rightarrow \left|e,n+1\right\rangle$
  with strength $\eta \Omega n$. It leads to an increase of the trap
  level and it is resonant for $\Delta = \omega_t$.

The full energy diagram is summarized in the figure below.

<figure id="fig-paul-exp">
<img src="./lecture20_pic5.png" width="60%" />
<figcaption>Level structure of an two-level system coupled to a laser field as
discussed in the text.</figcaption>
</figure>

This scheme is used to perform **Raman side-band cooling**. The laser is
tuned on the transition
$\left|n,g\right\rangle\rightarrow \left|n-1,e\right\rangle$
such that each absorption involves a reduction in the trap level. This
set-up for cooling was first demonstrated in [1995 by the Wineland group](http://dx.doi.org/10.1103/physrevlett.75.4011).

It is at this stage that the ions are in the motional ground state and
we can focus our attention to the high control of the internal qubit
states of the ion for quantum computing.

# Single-qubit operations

The single qubit operations can now be identified with the transition
$\left|e,n\right\rangle\leftrightarrow \left|g,n\right\rangle$.
We can then simplify the atom-light interaction too:

$$
\hat{H}= \hbar\Delta \left|e\right\rangle\left\langle e\right| + \frac{\hbar\Omega}{2}\left(\left|e\right\rangle\left\langle g\right|e^{i\varphi} +\left|g\right\rangle\left\langle e\right|e^{-i\varphi}\right)
$$

We can translate this into the language of qubit
operations through the definitions:

$$
\sigma_z = \frac{\left|e\right\rangle\left\langle e\right|-\left|g\right\rangle\left\langle g\right|}{2}\\
\sigma_x = \frac{\left|e\right\rangle\left\langle g\right|+\left|g\right\rangle\left\langle e\right|}{2}\\
\sigma_y = \frac{i\left|e\right\rangle\left\langle g\right|-i\left|g\right\rangle\left\langle e\right|}{2}
$$

So we can now simply write the Hamiltonian as:

$$
\hat{H}= \hbar\Delta \sigma_z +\Omega_x \sigma_x +\Omega_y \sigma_y\\
\Omega_x = \Omega \cos(\varphi)\\
\Omega_y = \Omega \sin(\varphi)
$$

In the QC community people rarely talk about the Pauli matrices, but
much rather about a few specific gates. The most cited here is the
_Hadamard_ gate, which transforms
$\left|0/1\right\rangle\rightarrow \frac{\left|0\right\rangle\pm\left|1\right\rangle}{\sqrt{2}}$.
So it has no good classical analog. Further a double application brings
us back to the origin.

The other gate we named about was a Z gate, which is simply a $\pi$
rotation around the z axis.

# Two-qubit operations

To implement a quantum computer the system has to be completed by a
two-qubit operation. For ions a number of two-qubit gates exist as
discussed nicely in [Sec. 2.6 of Haffner 2008](http://dx.doi.org/10.1016/j.physrep.2008.09.003):

- The **Cirac-Zoller** gate was the [first proposed two-qubit gate](http://dx.doi.org/10.1103/physrevlett.74.4091)
  [@Cirac_1995] and it was also the first one realized [within the same
  year](http://dx.doi.org/10.1103/physrevlett.75.4714).

- The **Soerensen-Moelmer** gate was [proposed later](http://dx.doi.org/10.1103/physrevlett.82.1971),
  but it is extremely important from a practical point of view as it
  leads to very high entanglement fidelities.

- Another realization, which we mention for completeness is the
  geometric phase-gate, which is used [in the NIST group](http://dx.doi.org/10.1038/nature01492).

We will now discuss a bit the Soerensen-Moelmer gate, which is nicely
described [here](http://dx.doi.org/10.1103/physreva.62.022311). In this set-up two ions sit in a
common trap. The cost of energy for exciting one of the ions will be
labelled $\omega_t$ as in the first section. So we assume that the
scheme starts in the state $\left|ggn\right\rangle$, where
both atoms are in the internal ground-state $g$ and in some excited trap
level $n$.

In the next step, these two ions experience two lasers, which are
coupling excited and the ground state of the ions:

- One laser has frequency $\omega_1=\omega_0-\omega_t+\delta$ and Rabi
  coupling strength $\Omega$. It is therefore only slightly detuned
  from the transitions
  $|ggn\rangle\rightarrow|eg,n-1\rangle |ge,n-1\rangle$.

- The second laser has frequency $\omega_2=\omega_0+\omega_t-\delta$
  and Rabi coupling strength $\Omega$. It is therefore only slightly
  detuned from the transitions
  $|ggn\rangle\rightarrow|eg,n+1\rangle |ge,n+1\rangle$.

The resulting level diagram is depicted below.

<figure>
<img src="./lecture20_pic6.png" width="60%" />
<figcaption>Level scheme of the Sorensen Moelmer gate as described in the text.</figcaption>
</figure>

The gate is then operated in the regime of small coupling strength
$\eta \Omega n \ll \delta$. In this case coupling to the excited
motional states $n\pm 1$ is suppressed by a factor of
$\frac{\eta \Omega n}{\delta}$. On the other hand we are exactly on
resonance for the two-photon transitions
$|ggn\rangle\rightarrow|eg,n+1\rangle\rightarrow|ee,n\rangle$ etc. So we
can do second-order pertubation theory to obtain the
effective Hamiltonian:

$$
H_\mathrm{SM} = \frac{\Omega_\mathrm{SL}}{2}\left(\left|ggn\right\rangle\left\langle een\right| + (\left|een\right\rangle\left\langle ggn\right|\right)\text{ with }\Omega_{SL} = -\frac{(\Omega \eta)^2}{2(\eta - \delta)}
$$

So starting out with the state
$\left|gg\right\rangle$ and applying the laser for
$t\Omega =\frac{\pi}{2}$, we obtain the entangled state that we are
looking for.

The operation of the gate was first demonstrated in 2000 by the Wineland
group and allowed at the time for generating a Bell state [with a
fidelity of 83%](http://dx.doi.org/10.1038/35005011). This limit has been increasingly pushed
of the years and now [reaches the 99.9% region](http://dx.doi.org/10.1103/physrevlett.117.060504).

Such a fidelity sounds very impressive on first sight and it is by now
the result of several decades of work. However, in a quantum computer we
would like to chain a large number of these gates behind each other.

- After 10 iterations the fidelity dropped to 99%.

- After 100 iterations the fidelity dropped to 90%.

- After 1000 iterations the fidelity dropped to 30%.

So even with such an excellent fidelity it will barely be possible to
chain much more than 100 gates before the some extremely iffy things
start to happen.

<figure>
<img src="./lecture20_pic7.png" width="60%" />
<figcaption>From the iSWAP to the CNOT gate.</figcaption>
</figure>

So we have experimentally the choice of entanglement tool in the way
that is most adapted to our work.

# Practical considerations

A commonly used ion is $\mathrm{Ca+} \, (Z=20)$. The level scheme of the calcium atom is shown below. The different
transitions are used for different purposes:

- The broad transition at 397nm is used for cooling.

- Coupling between the qubit states is performed through the 729nm
  transition.

- The 866nm and the 854nm are used for pumping the atoms into
  appropiate substates.

<figure>
<img src="./lecture20_pic8.png" width="60%" />
<figcaption>The level scheme of the calcium atom. The arrows indicate transitions
by absorption and emission of photons. A qubit can be realized by
choosing the ground state and an excited state. Taken
from <a href="http://dx.doi.org/10.1088/1367-2630/15/12/123012">here</a>.</figcaption>
</figure>

Several solutions for scaling up the quantum computing architecture are
under way . *Long ion chains* in linear Paul traps with up to 40
ions are the current 'work-horse'. This is the 'simplest' existing
architecture. In such a geometry Shors algorithm was [shown for the
number 15](http://dx.doi.org/10.1126/science.aad9480) with five qubits and entanglement between up to
[14 qubits was studied](http://dx.doi.org/10.1103/physrevlett.106.130506). However, it reaches its natural
limits for entangling distant ions due to cross-talk with other ions
during the operation. Therefore, different approaches are currently
tested to scale the architecture to larger [fault-tolerant geometries](http://dx.doi.org/10.1103/physrevx.7.041061).

By no means we will be able to give a full picture of the booming field.
However, a few main players are:

- NIST, JQI and IonQ, which are all strongly connected through their
  shared past with Dave Wineland.

- Innsbruck,  Mainz and AQT which are connected through their shared
  past and present with Rainer Blatt.

- ETH, Oxford, ...

- The AQTION and the MicroQC network, which are part of the European
  flagship initiative.

[^1]:
    Philipp Hauke worked a lot with them. Fred is an AMO person and
    Ferdinand Schmidt-Kaler was kind enough to provide a lot of
    background information on the experiments
