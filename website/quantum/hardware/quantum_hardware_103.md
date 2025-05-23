---
author:
  - Fred Jendrzejewski
order: 3
title: Tutorial 3 - A few words about quantum computing with trapped ions
---

In this tutorial, we are going to discuss the fundamental ingredients for
quantum computing with trapped ions.

- In a first step, we discuss trapping and cooling in a harmonic oscillator, which was introduced in the [second tutorial](qhw2).
- Then we can discuss the implementation and control of the single qubit as generally summarized in the [first tutorial](qhw1) operations.
- Finally, we discuss how two ions are entangled through different two-qubit gates.

Even if an enormous amount of additional literature
exists, I will only reference here to a [nice introduction](https://arxiv.org/abs/1804.03719v1) and a more complete list is left for future discussions.

## What do we want from a quantum computing hardware ?

In a QC we would like to implement algorithms, which are based on well
defined operations. Influential examples of such algorithms are the
quantum Fourier transform and the Grover algorithm.

Given that computations are often implemented through logical truth
tables, we typically base a quantum computer on qubits. We then call one
state $\left|0\right\rangle$ and on
$\left|1\right\rangle$. Given that we would like to have
reproducable computations, we always assume that we start them out with
all qubits in the $\left|0\right\rangle$ state.

A computation then consists then in applying a number of gates. The key is
here that any algorithm might be built up from an extremely limited
number of gates. Typically four are sufficient:

- The three gates that rotate each individual qubit on the Bloch
  sphere.

- A gate that entangles them properly. The standard example is here
  the CNOT gate, which we will come back too.

Such computations are then typically nicely visualized through circuit
diagrams often resulting from the interaction with programming framworks like `pennylane` or `qiskit`. To make the programs flexible enough, we might want a checklist of what we want from a quantum computer hardware. DiVincenzo proposed
the [following ingredients](https://www.sciencedirect.com/science/article/abs/pii/S0370157308003463?via%3Dihub):

1.  Qubits that can store information in a scalable system.

2.  The ability to initialize the system in the right state.

3.  A universal set of gates.

4.  Long coherence times, which are much longer than gate operation times.

5.  Good measurement capabilities

Trapped ions allow us to fulfill all these requirements as we will see
in this lecture and we will go through them step-by-step.

## Trapping and cooling

For computing experiments one typically works with singe-charged ions
like $Ca^+$. Given their charge, they can be trapped in very clean
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
Wolfgang Paul and Hans Dehmelt. They shared
the prize with Norman Ramsey, who developped extremely precise
spectroscopic methods, now known as Ramsey spectroscopy.

A Paul trap provides a harmonic oscillator confinement with trapping
frequencies in the order of hundreds of kHz. An ion trapped in such a
trap can the be described by the Hamiltonian:

$$
\begin{aligned}
\hat{H}_{t} &= \frac{\hat{p}^2}{2m}+ \frac{m\omega_t^2}{2}\hat{x}^2\end{aligned}
$$

The two variables $p$ and $x$ are non-commuting $[x, p] = i\hbar$, so
they cannot be measured at the same time. It can be nicely diagonalized
in terms of the ladder operators:

$$
\begin{aligned}
\hat{x} &= \sqrt{\frac{\hbar}{2m\omega_t}}\left(\hat{a}+\hat{a}^\dagger\right)\\
\hat{p} &= i\sqrt{\frac{\hbar}{2m\omega_t}}\left(\hat{a}^\dagger-\hat{a}\right)\\\end{aligned}
$$

So the Hamiltonian can now be written as:

$$
\begin{aligned}
\hat{H} &= \hbar \omega_t \left(\hat{N} + \frac{1}{2}\right)\text{ with } \hat{N} = a^\dagger a
\end{aligned}
$$

Having loaded the ions into the Paul trap we also need to cool them
down.

## Atom-light interaction

Given that the ions keep only on atom on the outer shell, they have a
hydrogenlike structure, which makes them well controllable with light.

Experimentally, we will then use light of amplitude $E_0$ and frequency $\omega_L$:

$$
\begin{aligned}
\vec{E}(t) &= \vec{E}_0 \cos(kx - \omega_L t+\varphi)\\
&= \frac{\vec{E}_0}{2} \left(e^{i[kx - \omega_lt+\varphi]}+e^{-i[kx-\omega_lt+\varphi]}\right) \end{aligned}
$$

We will describe the interal states of the ion for the moment with the
simple two state system of ground state
$\left|g\right\rangle$ and excited state
$\left|e\right\rangle$ at an energy $\hbar \omega_0$, which
is typically in the order of thousands of THz. It has the Hamiltonian:

$$
\begin{aligned}
H_{ion} = \hbar \omega_0 \left|e\right\rangle\left\langle e\right|\end{aligned}
$$

Putting this ion into propagating light will induce a coupling between
these two internal states. As previously , we will describe the coupling
in the semi-classical approximation through
$H_\textrm{int} = -\hat{\vec{D}} \cdot \vec{E}$. However, in this
context we will not ignore the propagating nature of the light field and
keep its position dependence. This is necessary as we would like to
understand how the light influences the movement of the atoms and not
only the internal states. Putting them together we obtain:

$$
\begin{aligned}
H_\textrm{int} &= \frac{\Omega}{2}\left([\left|g\right\rangle\left\langle e\right|+\left|e\right\rangle\left\langle g\right|]e^{i(k \hat{x} - \omega_L t+\varphi)} + h.c.\right)\end{aligned}
$$

The laser frequency is tuned closely to the frequency of the internal
state transition and we will be only interested in the detuning
$\Delta = \omega_0 - \omega_L$. Importantly, it couples the position of
the atom and the internal states.

To simplify the problem, we can work in the rotating frame to describe
the external and internal degrees of freedom for the ion:

$$
\begin{aligned}
\hat{H}= \hbar \omega_t \hat{a}^\dagger \hat{a} + \hbar\Delta \left|e\right\rangle\left\langle e\right| + \frac{\Omega}{2}\left(\left|e\right\rangle\left\langle g\right|e^{i\left(k \hat{x}+\varphi\right)} + h.c.\right)\end{aligned}
$$

We will now see how this system is used to cool the ions to the motional
groundstate, perform single qubit operations and then two-qubit
operations.

## Doppler cooling

This interaction of the atom with a photon is at the origin of the
all-important Laser cooling, which was pioneered for ions in the 1970s
(!!) by the Wineland group. For cooling transition we couple the ground
state to an excited state of finitie lifetime $\tau= \frac{1}{\Gamma}$.

This laser cooling had a tremendous impact on the field of atomic
physics in general. This importance was
recognized in the [Nobel prizes of 1997](https://www.nobelprize.org/prizes/physics/1997/summary/) for Steve Chu , Claude
Cohen-Tannoudji and Bill Phillips.

### Working in the Lamb-Dicke regime

After this initial cooling stage the atoms have to be cooled to the
ground state in the trap. To treat the trapped particles we will express
the position operator in terms of the ladder operator, such that:

$$
\begin{aligned}
k\hat{x} &= \eta (\hat{a}^\dagger+ \hat{a})\\
\eta &= \sqrt{\frac{\hbar^2 k^2/2m}{\hbar \omega_t}} =\sqrt{\frac{E_R}{\hbar \omega_t}}\end{aligned}
$$

$\eta$ is called the _Lamb-Dicke_ parameter. It compares the change in
motional energy due to the absorption of the photon
$E_r = \frac{(\hbar k)^2}{2m}$ compared to the energy spacing
$\hbar \omega_t$ in the trap. When it is small it suppresses the change
of the motional state of the atom due to the absorption of a photon.

For simplicity we will set in this section $\varphi=0$ and develop the
exponent to obtain:

$$
\begin{aligned}
H_\textrm{int} &= \frac{\Omega}{2}\left(\left|e\right\rangle\left\langle g\right|\left(1 + i\eta[\hat{a}^\dagger+ \hat{a}]\right) + h.c.\right)\end{aligned}
$$

So it contains three couplings for different trap levels and internal
states:

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

This scheme is used to perform **Raman side-band cooling**. The laser is
tuned on the transition
$\left|n,g\right\rangle\rightarrow \left|n-1,e\right\rangle$
such that each absorption involves a reduction in the trap level. This
set-up for cooling was first demonstrated in 1995 by the Wineland group.

It is at this stage that the ions are in the motional ground state and
we can focus our attention to the high control of the internal qubit
states of the ion for quantum computing.

## Single-qubit operations

The single qubit operations can now be identified with the transition
$\left|e,n\right\rangle\leftrightarrow \left|g,n\right\rangle$.
We can then simplify the above equation too:

$$
\begin{aligned}
\hat{H}= \hbar\Delta \left|e\right\rangle\left\langle e\right| + \frac{\hbar\Omega}{2}\left(\left|e\right\rangle\left\langle g\right|e^{i\varphi} +\left|g\right\rangle\left\langle e\right|e^{-i\varphi}\right)
\end{aligned}
$$

We can translate this into the language of qubit operations through the
definitions:

$$
\begin{aligned}
\sigma_z &= \frac{\left|e\right\rangle\left\langle e\right|-\left|g\right\rangle\left\langle g\right|}{2}\\
\sigma_x &= \frac{\left|e\right\rangle\left\langle g\right|+\left|g\right\rangle\left\langle e\right|}{2}\\
\sigma_y &= \frac{i\left|e\right\rangle\left\langle g\right|-i\left|g\right\rangle\left\langle e\right|}{2}
\end{aligned}
$$

So we can now simply write the Hamiltonian as:

$$
\begin{aligned}
\hat{H}/\hbar &= \Delta \sigma_z +\Omega_x \sigma_x +\Omega_y \sigma_y\\
\Omega_x &= \Omega \cos(\varphi)\\
\Omega_y &= \Omega \sin(\varphi)
\end{aligned}
$$

In the QC community people rarely talk about the Pauli matrices, but
much rather about a few specific gates. The most cited here is the
_Hadamard_ gate, which transforms
$\left|0/1\right\rangle\rightarrow \frac{\left|0\right\rangle\pm\left|1\right\rangle}{\sqrt{2}}$.
So it has no good classical analog. Further a double application brings
us back to the origin.

The other gate we named about was a Z gate, which is simply a $\pi$
rotation around the z axis.

## Two-qubit operations

To implement a quantum computer the system has to be completed by a
two-qubit operation. For ions a number of two-qubit gates exist:

- The **Cirac-Zoller** gate was the [first proposed](https://journals.aps.org/prl/abstract/10.1103/PhysRevLett.74.4091) two-qubit gate and it was also the first one realized within the [same year](https://journals.aps.org/prl/abstract/10.1103/PhysRevLett.75.4714) .

- The [**Soerensen-Moelmer**](https://journals.aps.org/prl/abstract/10.1103/PhysRevLett.82.1971) gate was proposed later, but it is extremely important from a practical point of view as it leads to very high entanglement fidelities.

- Another realization, which we mention for completeness is the [geometric phase-gate](https://www.nature.com/articles/nature01492), which is used in the NIST group.

We will now discuss a bit the Soerensen-Moelmer gate. In this set-up two ions sit in a common trap. The cost of energy for exciting one of the ions will be
labelled $\omega_t$ as in the first section. So we assume that the
scheme starts in the state $\left|ggn\right\rangle$, where
both atoms are in the internal ground-state $g$ and in some excited trap
level $n$.

In the next step, these two ions experience two lasers, which are
coupling excited and the ground state of the ions:

- One laser has frequency $\omega_1=\omega_0-\omega_t+\delta$ and Rabi
  coupling strength $\Omega$. It is therefore only slightly detuned from the transitions $|ggn\rangle\rightarrow|eg,n-1\rangle |ge,n-1\rangle$.

- The second laser has frequency $\omega_2=\omega_0+\omega_t-\delta$ and Rabi coupling strength $\Omega$. It is therefore only slightly detuned from the transitions $|ggn\rangle\rightarrow|eg,n+1\rangle |ge,n+1\rangle$.

The gate is then operated in the regime of small coupling strength
$\eta \Omega n \ll \delta$. In this case coupling to the excited
motional states $n\pm 1$ is suppressed by a factor of
$\frac{\eta \Omega n}{\delta}$. On the other hand we are exactly on
resonance for the two-photon transitions
$|ggn\rangle\rightarrow|eg,n+1\rangle\rightarrow|ee,n\rangle$ etc. So we
can do second-order pertubation theory or
adiabatic elimination to obtain the
effective Hamiltonian:

$$
\begin{aligned}
H_\mathrm{SM} &= \frac{\Omega_\mathrm{SL}}{2}\left(\left|ggn\right\rangle\left\langle een\right| + (\left|een\right\rangle\left\langle ggn\right|\right)\text{ with }\Omega_{SL} = -\frac{(\Omega \eta)^2}{2(\eta - \delta)}\end{aligned}
$$

So starting out with the state $\left|gg\right\rangle$ and
applying the laser for $t\Omega =\frac{\pi}{2}$, we obtain the entangled
state that we are looking for.

The operation of the gate was first demonstrated in 2000 by the Wineland
group and allowed at the time for generating a Bell state with a
[fidelity of 83%](https://www.nature.com/articles/35005011). This limit has been increasingly pushed of the years and now reaches the 99.9% region.

Such a fidelity sounds very impressive on first sight and it is by now
the result of several decades of work. However, in a quantum computer we
would like to chain a large number of these gates behind each other.

- After 10 iterations the fidelity dropped to 99%.

- After 100 iterations the fidelity dropped to 90%.

- After 1000 iterations the fidelity dropped to 30%.

So even with such an excellent fidelity it will barely be possible to
chain much more than 100 gates before the some extremely iffy things
start to happen.

So we have experimentally the choice of entanglement tool in the way
that is most adapted to our work.

## Summary

Trapped ions have now become a major platform for quantum computation and in this tutorial, we have discussed the main ingriedients that underlie the computation. If you would like to use the devices, there are now emerging three major competitors within this technology stack:

- [IonQ](https://ionq.com/) is based in Maryland with Chris Monroe as one of the founders. It was one of the first pure quantum computation companies and is now publically traded at the NASDAQ.

- [AQT](https://www.aqt.eu/) is a european company that is closely connected to the research team in Innsbruck around some of the founding fathers of the field like Rainer Blatt or Peter Zoller.

- [Quantinuum](https://www.quantinuum.com/) has its traditions in the NIST Boulder region on the hardware side. Despite their slightly younger age as a company they have recently demonstrated very high fidelity processors and became one of the leading players.

In next weeks tutorial, we will move on to superconducting qubits and see how they are implementated.

```python

```
