---
author:
  - Fred Jendrzejewski
order: 4
title: Tutorial 4 - A few words about quantum computing with superconducting qubits
---

We have seen in the [last tutorial](./2) the
possibilities of quantum computation with trapped ions. However, a second major platform are superconducting qubits. They the platform of choice of commercial giants like [google](https://quantumai.google/), [IBM](https://www.ibm.com/quantum) or [Rigetti](https://www.rigetti.com/).
In this tutorial, we will identify the existence of qubits in superconducting circuits, the different gates and the read-out. We will finish by a comparison in the computing performance of trapped ions and
superconducting qubits.

## The quantum LC-oscillator

As in the second tutorial, we have to find the appropiate harmonic oscillator, but this time in electric circuits. Then we can discuss
the need of the Josephson junction for the implementation of
superconducting qubits.

The fundamental ingredient for superconducting qubits are LC
oscillators, which are simply put a loop of wire which is not closed. To study
its quantum behavior we will closely follow the discussion in Sec. II of
["A Quantum Engineer's Guide to Superconducting Qubits"](https://arxiv.org/abs/1904.06560v2).

In electrical engineering we first have to identify the conjugate
variables within the circuit. We will therefore follow the standard procedure of:

1.  Identifying the equations of motion.

2.  Identify the Lagrangien.

3.  Identify the conjugate variables.

4.  Write down the Hamiltonian.

5.  Quantize the Hamiltonian.

While it might be overly complicated for simple LC circuits it provides
a powerful framework for more complex systems (see [Nigg et al.](https://doi.org/10.1103/physrevlett.108.240502)
)

### Lagrangien formulation

The wire is caracterized by an _inductivity_, which is counteracting the
change in current:

$$
\begin{aligned}
V = L\frac{dI}{dt}\end{aligned}
$$

and a _capacitance_, which allows us
to measure the cost of putting charges on the ends of the wire:

$$
\begin{aligned}
I = C\frac{dV}{dt}\end{aligned}
$$

To put it under a partical form for
quantization we typically express them through the flux, which is
defined as:

$$
\begin{aligned}
\Phi(t) = \int_{-\infty}^tV(t')dt'\end{aligned}
$$

The electromagnetic
energy stored within the loop of wire is in general given by:

$$
\begin{aligned}
E(t) &= \int_{-\infty}^t V(t')I(t')dt'\end{aligned}
$$

We then obtain the
energies:

$$
\begin{aligned}
E_{kin} = \frac{1}{2}C\dot{\Phi}^2\\
E_{pot} = \frac{1}{2L}\Phi^2\\\end{aligned}
$$

This now leads to the
Lagrangien:

$$
\begin{aligned}
L &= \frac{1}{2}C\dot{\Phi}^2-\frac{1}{2L}\Phi^2\end{aligned}
$$

### Quantization

We can now identify the conjugate momentum the flux as:

$$
\begin{aligned}
\frac{\partial L}{\partial\dot{\Phi}} &= C \dot{\Phi}\\
&= Q\end{aligned}
$$

So the charge is the conjugate variable to the flux
in the loop. They will be therefore the two fundamental variables of
quantum theory, very much like position and momentum are for massive
particles.

We can now write down the Hamiltonian as:

$$
\begin{aligned}
H &= Q\dot{\Phi}- L\\
&= \frac{Q^2}{2C}+\frac{\Phi^2}{2L}\end{aligned}
$$

At this stage we can
quantize the system through the commutation relation:

$$
\begin{aligned}
[\hat{\Phi},\hat{Q}]&= i\hbar\\
\hat{H} &= \frac{\hat{Q}^2}{2C}+\frac{\hat{\Phi}^2}{2L}\end{aligned}
$$

So it is once again a harmonic oscillator with resonance frequency
$\omega_r = \frac{1}{\sqrt{LC}}$ and 'mass' $C$. So the system reads:

$$
\begin{aligned}
\hat{H} &= \hbar \omega_r \left(\hat{a}^\dagger a + \frac{1}{2}\right)\end{aligned}
$$

While this is now a quantum system, it is manifestly not a qubit as the
transitions are equidistant in energy with $\omega_r$. The typical order
of magnitude is here 3-6GHz.

To prepare for the introduction of superconducting elements, we typically rewrite the equations above in terms of dimensionless quantities. Namely the Cooper pair density $n = \frac{Q}{2e}$ and the reduced flux $\phi= 2\pi \Phi/\Phi_0$ with $\Phi_0 = \frac{h}{2e}$. These two quantities correspond directly to the density and the phase of the superconducting wavefunction that we will discuss in the next section. We then obtain the Hamiltonian $$\begin{aligned} \hat{H} = 4E_C n^2 + \frac{1}{2}E_L \varphi^2\end{aligned}$$ So we quantify the influence of each lump element through their energy:

- $E_C=\frac{e^2}{2C}$ is the energy required to add a cooper pair.

- $E_L=\frac{(\Phi_0/2\pi)^2}{L}$ is the inductive energy

## The Josephson junction

To resolve the degeneracy we need to make the oscillator anharmonic.
This is done through _Josephson junctions_, which are the backbone of
superconducting electronics (very much like the transistor or the diode
are classical electronics). To understand them roughly, we will fall
back on the [Feynman
picture](http://www.feynmanlectures.caltech.edu/III_21.html) of
Josephson dynamics.

### A simplistic picture of superconductivity

We could spend several lectures to understand the physics of Josephson
junctions in all its gory details. A good overview might be found in the
following books [(D.R. Tilley, 1990](https://www.crcpress.com/Superfluidity-and-Superconductivity/Tilley-Tilley/p/book/9780750300339); [Tinkham, 2004)](https://books.google.de/books?id=VpUk3NfwDIkC). However, the basic idea is that the fermionic electrons form cooper
pairs at very low temperatures. These pairs are bosonic and can hence
condense into a macroscopic wavefunction: $$\begin{aligned}
\psi(x,t) &= \sqrt{n}e^{i\varphi(x,t)}\end{aligned}$$ Now the system can
be understood through the following relations:

- the density is given by $n= |\psi(x,t)|^2$.

- The velocity is set by the gradient of the phase
  $\vec{v}= \frac{\hbar}{2m_e}\nabla \varphi$.

- The voltage is set by the time evolution of the phase
  $V = \frac{\hbar}{2e} \frac{\partial \varphi}{\partial t}$.

### The Josephson relations

A Josephson junction describes now a system where two superconducting
regions are slightly separated by a normal metal such that only
tunneling is allowed between the two regions.

We can now write down the Schrödinger equation for this setup:

$$
\begin{aligned}
i\hbar \partial_t \psi_L &= \frac{eV}{2}\psi_L+J \psi_R\\
i\hbar \partial_t \psi_R &= -\frac{eV}{2}\psi_R+J \psi_L\end{aligned}
$$

$V$ is the voltage applied to the junction and $J$ is the tunneling
element. We now use the decomposition to write:

$$
\begin{aligned}
\dot{n}_L &= \frac{2}{\hbar}J\sqrt{n_Rn_L}\sin(\delta )\\
\dot{n}_R &= -\frac{2}{\hbar}J\sqrt{n_Rn_L}\sin(\delta)\\
\phi &=\varphi_L-\varphi_R\end{aligned}
$$

We can now use it to write
down the current-phase relationship:

$$
\begin{aligned}
I &= I_c\sin(\phi)\\
I_c &= \frac{2}{\hbar}Jn\end{aligned}
$$

We can once again integrate the
equation of motion to obtain:

$$
\begin{aligned}
\hat{H} = 4E_Cn^2-E_J \cos(\phi)\\
E_C = \frac{e^2}{2(C+C_J)}\\
E_J = \frac{I_C\Phi_0}{2\pi}\end{aligned}
$$

## Single qubit control

Superconducting qubits can be controlled either through inductive or
capacitive coupling. Inductive coupling is widely used for flux-qubits
like the rf-squid. However, here we focus on the transmon qubit, which
is typically capacitavely coupled

Going through the quantization procedure we discussed above, we can write
the circuit Hamiltonian as:

$$
\begin{aligned}
\hat{H} &= \frac{\tilde{Q}^2}{2C_\Sigma}+\frac{\Phi^2}{2L}+\frac{C_d}{C_\Sigma}V_d(t)\tilde{Q}\end{aligned}
$$

The charge is defined for this system as
$\tilde{Q} = C_\Sigma\dot{\Phi} - C_d V_d(t)$. In the limit of weak
coupling $C_d V_d \ll C_\Sigma \dot{\Phi}$, we have can quantize the
system as before and only need to understand the influence of the last
term.

The second part of the Hamiltonian resembles strong the electric dipole
coupling we discussed in the last lecture. It contains the displaced
charge, which is linearly coupled to an oscillating electric field. So
we can rewrite the charge once again in terms of raising an lower
operators and arrive at the coupled Hamiltonian:

$$
\begin{aligned}
\hat{H} &= \frac{\omega_t}{2}\hat{\sigma}_z+\Omega V_d(t)\hat{\sigma}_y\end{aligned}
$$

All the other discussions are equivalent to our discussion on the ion
and any other single qubit system.

## Generating entanglement

Having identified the qubit, we can now also implement the entanglement
gate to build the universal quantum computer. Different options exist:

- The qubit island could be coupled through a mutual capacitance, such
  that $\hat{H}_{int}= C_g V_1 V_2$.

- The qubit island could be coupled through a mututal inductance, such that $\hat{H}_{int}= M_{12} I_1 I_2$.

Typically the inductive coupling is chosen in a regime of very small
coupling $C_g \ll C_1, C_2$, where the $C_i$ describe the transmon
qubits. The full Hamiltonian reads then:

$$
\begin{aligned}
\hat{H} &=\hat{H}_{T,1}+\hat{H}_{T,2}+4e^2\frac{C_g}{C_1C_2}n_1n_2\end{aligned}
$$

we identified here $V_i = \frac{2e}{C_i}n_i$. We can now further rewrite
the occupation in terms of raising and lowering operators
$n\propto i(a-a^\dagger)$, which is can be expressed as a Pauli matrix for
the buttom manifold. So we actually have the coupling:

$$
\begin{aligned}
\hat{H} &=\hat{H}_{T,1}+\hat{H}_{T,2}+g\sigma_{y,1}\sigma_{y,2}\end{aligned}
$$

While this basic operating principle of capacitive coupling is indeed
widely used, it is worth to read the fine-print as the different actual
implementation can to different 2-Qubit gates:

- The **iSWAP** gate is the implementation of the $\sigma_y \sigma_y$
  coupling.

- The **phase** gate, shows very high fidelities, but makes it necessary to tune the freuqency of the qubit. It implements a $\sigma_z \sigma_z$-coupling on the spins. Fidelities of \> 99% were demonstrated for this gate [(Barends et al., 2014)](https://doi.org/10.1038/nature13171).

- The **cross-resonance** (CR) gate is only controlled through
  microwaves. It implements the a $\sigma_x \sigma_z$-coupling on the
  spins. This is gate employed by IBM [(Chow et al., 2011)](https://doi.org/10.1103/physrevlett.107.080502).

## A CNOT gate constructed from the physical entangling gates

We would now like to discuss how we can use the capacitive coupling to
implement a CNOT gates. This discussion is closely related to the
possibility of using a Soerensen-Molmer gate, discussed in lecture 2, to
implement a CNOT gate.

The $\sigma_y \sigma_y$ coupling for the right amount of leads to a
coupling matrix:

$$
\begin{aligned}
iSWAP &= \left(\begin{array}{cccc}
1 & 0 & 0 & 0\\
0 & 0 &-i & 0\\
0 & -i & 0 & 0\\
0 & 0 & 0 & 1
\end{array}\right)\end{aligned}
$$

The iSWAP can then be used to
represent the CNOT gate.

So we will focus shortly on the current limitations of qubit systems.
Please be aware that this is a rapidly evolving field, so most likely
the paragraph will be outdated within a few months. One good summary can
be found in [(Linke et al., 2017)](https://doi.org/10.1073/pnas.1618020114) and written by an ion trapping group.

## Summmary

In this tutorial, we discussed how the two level system is implemented in superconducting devices and how they are coupled. This should give you a basic feeling for this widely used hardware platform and its limitations.
