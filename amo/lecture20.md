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
[@Nielsen_2009]. However, an enormous amount of additional literature
exists, I will only reference here to a nice introduction [@beginners] a
more complete list is left for future discussions.

In this lecture we will discuss shortly the idea behind quantum
computing and the discuss its implementation on trapped ions. While a
large number of them exist, we decided to start with trapped ions for
several very subjective reasons [^1].

And before we can start the discussion we would highly recommend the
readers to take some time to go through the Nobel prize lecture of Dave
Wineland as it gives a detailled discussion of the field from his point
of view [@Wineland_2013].

# What do we want from a QC ?

In a QC we would like to implement algorithms, which are based on well
defined operations. Influential examples of such algorithms are the
quantum Fourier transform and the Grover algorithm [@beginners].

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
visualized in Fig. [1](#354313){reference-type="ref" reference="354313"}

![A simple circuit diagram. It show the initial state, an entanglement
gate, a number of single qubit gates and the final readout. []{#354313
label="354313"} ](figures/TwoQubitsCircuit/TwoQubitsCircuit){#354313
width="0.70\\columnwidth"}

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
solved how efficiently [@zoo].

The most fundamental question is then if a problem can be solved in a
polynomial time (P hard) or not (NP-hard). Linear problems are P-hard
and the travelling salesman problem is NP-hard. For some problems a
quantum computer might then provide an answer in polynomial time, where
a classical computer would not\... The factorization of prime numbers is
one of these problems as discussed in Shor algorithm.

And the google paper that was published in 2019 actually indicated for
the first time that a quantum computer achieved such a task
[@Arute_2019].

## Requirements for a QC

Given our excitement for a quantum computer, we might want a checklist
of what we want from a quantum computer hardware. DiVincenzo proposed
the following ingredients [@HAFFNER_2008]:

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
Wolfgang Paul [@Paul_1990] and Hans Dehmelt [@Dehmelt_1990]. They shared
the prize with Norman Ramsey, who developped extremely precise
spectroscopic methods, now known as Ramsey spectroscopy [@Ramsey_1990].

![The two phases of the oscillating electric field of a Paul trap. Taken
from [wikipedia](https://en.wikipedia.org/wiki/Quadrupole_ion_trap).
[]{#692754 label="692754"}
](figures/354px-Paul-Trap/354px-Paul-Trap){#692754
width="0.70\\columnwidth"}

![A linear ion (Paul) trap containing six calcium 40 ions. Taken
from [here](https://quantumoptics.at/en/research/lintrap.html) .
[]{#570611 label="570611"} ](figures/trap3/trap3){#570611
width="0.70\\columnwidth"}

A Paul trap provides a harmonic oscillator confinement with trapping
frequencies in the order of hundreds of kHz. An ion trapped in such a
trap can the be described by the Hamiltonian:

$$

\hat{H}_{t} = \frac{\hat{p}^2}{2m}+ \frac{m\omega_t^2}{2}\hat{x}^2
$$

The two variables $p$ and $x$ are non-commuting $[x, p] = i\hbar$, so
they cannot be measured at the same time. It can be nicely diagonalized
in terms of the ladder operators (see for more details see Section 1 of
[@Jendrzejewski]):

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
hydrogenlike structure [@Jendrzejewskia; @Jendrzejewskib], which makes
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
the external and internal degrees of freedom for the ion
[@Jendrzejewskic]:

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

The basic idea is visualized in Fig. [4](#960763){reference-type="ref"
reference="960763"} and more details can be found in Sec. IV.A of
[@Leibfried_2003].

![The basic idea of laser cooling. The incoming light gives the ion a
momentum kick $\vec{k}_{in}$. The photon is reemitted in a random
direction such that $<\vec{k}_{out}>=0$. []{#960763 label="960763"}
](figures/LaserCooling/LaserCooling-01){#960763
width="0.70\\columnwidth"}

This laser cooling had a tremendous impact on the field of atomic
physics in general. Notably it gave rise to the field of cold atoms to
which we will get back in the next lecture. This importance was
recognized in the Nobel prizes of 1997 for Steve Chu [@Chu_1998], Claude
Cohen-Tannoudji [@Cohen_Tannoudji_1998] and Bill Phillips
[@Phillips_1998].

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

The full energy diagram is summarized in Fig.
[5](#226851){reference-type="ref" reference="226851"}.

![Level structure of an two-level system coupled to a laser field as
discussed in the text. []{#226851 label="226851"}
](figures/LevelStructure/LevelStructure-01){#226851
width="0.70\\columnwidth"}

This scheme is used to perform **Raman side-band cooling**. The laser is
tuned on the transition
$\left|n,g\right\rangle\rightarrow \left|n-1,e\right\rangle$
such that each absorption involves a reduction in the trap level. This
set-up for cooling was first demonstrated in 1995 by the Wineland group
[@Monroe_1995].

It is at this stage that the ions are in the motional ground state and
we can focus our attention to the high control of the internal qubit
states of the ion for quantum computing.

# Single-qubit operations

The single qubit operations can now be identified with the transition
$\left|e,n\right\rangle\leftrightarrow \left|g,n\right\rangle$.
We can then simplify Eq.
[\[Eq:DressedAtomLightInteraction\]](#Eq:DressedAtomLightInteraction){reference-type="eqref"
reference="Eq:DressedAtomLightInteraction"} too:

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

So we can now simply write the Hamiltonian as
[@Jendrzejewskid]:

$$

\hat{H}= \hbar\Delta \sigma_z +\Omega_x \sigma_x +\Omega_y \sigma_\\
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
discussed nicely in Sec. 2.6 of [@HAFFNER_2008]:

- The **Cirac-Zoller** gate was the first proposed two-qubit gate
  [@Cirac_1995] and it was also the first one realized within the same
  year [@Monroe_1995a].

- The **Soerensen-Moelmer** gate was proposed later [@S_rensen_1999],
  but it is extremely important from a practical point of view as it
  leads to very high entanglement fidelities.

- Another realization, which we mention for completeness is the
  geometric phase-gate, which is used in the NIST group
  [@Leibfried_2003a].

We will now discuss a bit the Soerensen-Moelmer gate, which is nicely
described in Ref. [@S_rensen_2000]. In this set-up two ions sit in a
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

The resulting level diagram is depicted in Fig.
[6](#658942){reference-type="ref" reference="658942"}.

![Level scheme of the Sorensen Moelmer gate as described in the text.
[]{#658942 label="658942"}
](figures/SM-LevelDiagramv1/SM-LevelDiagramv1){#658942
width="0.70\\columnwidth"}

The gate is then operated in the regime of small coupling strength
$\eta \Omega n \ll \delta$. In this case coupling to the excited
motional states $n\pm 1$ is suppressed by a factor of
$\frac{\eta \Omega n}{\delta}$. On the other hand we are exactly on
resonance for the two-photon transitions
$|ggn\rangle\rightarrow|eg,n+1\rangle\rightarrow|ee,n\rangle$ etc. So we
can do second-order pertubation theory (Sec 1 of [@Jendrzejewskie])or
adiabatic elimination (see Sec. 2.1 of [@Jendrzejewskic]) to obtain the
effective Hamiltonian:

$$
H_\mathrm{SM} = \frac{\Omega_\mathrm{SL}}{2}\left(\left|ggn\right\rangle\left\langle een\right| + (\left|een\right\rangle\left\langle ggn\right|\right)\text{ with }\Omega_{SL} = -\frac{(\Omega \eta)^2}{2(\eta - \delta)}
$$

So starting out with the state
$\left|gg\right\rangle$ and applying the laser for
$t\Omega =\frac{\pi}{2}$, we obtain the entangled state that we are
looking for.

The operation of the gate was first demonstrated in 2000 by the Wineland
group and allowed at the time for generating a Bell state with a
fidelity of 83% [@Sackett_2000]. This limit has been increasingly pushed
of the years and now reaches the 99.9% region
[@Benhelm_2008; @Gaebler_2016; @Ballance_2016].

Such a fidelity sounds very impressive on first sight and it is by now
the result of several decades of work. However, in a quantum computer we
would like to chain a large number of these gates behind each other.

- After 10 iterations the fidelity dropped to 99%.

- After 100 iterations the fidelity dropped to 90%.

- After 1000 iterations the fidelity dropped to 30%.

So even with such an excellent fidelity it will barely be possible to
chain much more than 100 gates before the some extremely iffy things
start to happen.

![From the iSWAP to the CNOT gate. []{#483914 label="483914"}
](figures/Bildschirmfoto-2019-05-13-um-06-03-32/Bildschirmfoto-2019-05-13-um-06-03-32){#483914
width="0.70\\columnwidth"}

So we have experimentally the choice of entanglement tool in the way
that is most adapted to our work.

# Practical considerations

A commonly used ion is $\mathrm{Ca+} \, (Z=20)$. Per shell
we get:

      n      1   2   3   4

---

$N_{e}$ 2 8 8 1

The level scheme of the calcium atom is shown in
[8](#652265){reference-type="ref" reference="652265"}. The different
transitions are used for different purposes:

- The broad transition at 397nm is used for cooling.

- Coupling between the qubit states is performed through the 729nm
  transition.

- The 866nm and the 854nm are used for pumping the atoms into
  appropiate substates.

![The level scheme of the calcium atom. The arrows indicate transitions
by absorption and emission of photons. A qubit can be realized by
choosing the ground state and an excited state. Taken
from [@Schindler_2013]. []{#652265 label="652265"}
](figures/exploringthequantum/Bildschirmfoto-2019-04-23-um-16.33.03){#652265
width="0.70\\columnwidth"}

Several solutions for scaling up the quantum computing architecture are
under way .  *Long ion chains* in linear Paul traps as shown
in [3](#570611){reference-type="ref" reference="570611"} with up to 40
ions are the current 'work-horse'. This is the 'simplest' existing
architecture. In such a geometry Shors algorithm was shown for the
number 15 [@Monz_2016] with five qubits and entanglement between up to
14 qubits was studied [@Monz_2011]. However, it reaches its natural
limits for entangling distant ions due to cross-talk with other ions
during the operation. Therefore, different approaches are currently
tested to scale the architecture to larger fault-tolerant geometries
[@Bermudez_2017].

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
