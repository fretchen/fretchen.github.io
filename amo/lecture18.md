---
author:
  - Fred Jendrzejewski
  - Selim Jochim
  - Matthias Weidemüller
order: 18
title: Lecture 18 - Quantization of the Electromagnetic field
---

We are looking into the quantization of the electromagnetic field. How
to find the conjugate momenta and how we can identify the photon as a
quantized particle.

Until now we exclusively treated the atom, molecule etc in a
quantum-mechanical way. The electromagnetic field was always treated
classically. We will attempt to change that for various reasons:

- Spontaneous emission and the Lamb shift can only be understood
  within quantum electrodynamics.

- Several experiments control the electromagnetic field at the single
  photon level, so we have to understand how this works.

- It frankly very unsatifying to only quantize half the problem.

So before we start the endevour let us start out with the some reminders
on the properties of radiation in classical electromagnetism.

# Maxwell's Equations and Vector Potential

Electrodynamics is described by Maxwell's equations:

$$
\vec{\nabla} \cdot \vec{B} = 0\\
\vec{\nabla} \times \vec{E} + \frac{\partial \vec{B}}{\partial t}=0\\
\vec{\nabla} \cdot \vec{E} = \frac{1}{\epsilon_0}\rho(\vec{r},t) \\
\vec{\nabla} \times \vec{B} = \frac{1}{c^2} \frac{\partial \vec{E}}{\partial t}+\frac{1}{\epsilon_0 c^2}\vec{j}
$$

These equations are the equations of motion for the
electromagnetic field. The first two are the homogeneous Maxwell
equations and we can directly solve them by setting:

$$
\vec{B} = \vec{\nabla}\times\vec{A}\\
\vec{E}= -\frac{\partial}{\partial t}A-\nabla \phi
$$

Quite importantly, the choice of the potential $\vec{A}$
has an inherent gauge freedom as we can basically perform the _local
gauge transformation_:

$$

\vec{A} &\rightarrow \vec{A} + \vec{\nabla} f (\vec{r},t)\\
\phi &\rightarrow \phi - \frac{\partial f}{\partial t}
$$

So we can transform the electromagnetic field and the
magnetic field, but the equations of motion remain the same. It is this
local gauge freedom, which also allows us to have charge conservation.
But it is also this gauge freedom, which will make the quantization
rather technically involved.

## Free radiation

To simplify the problem, we will actually, only work on free
electromagnetic radiation, which simplifies the remaining Maxwell
equations too:

$$
\vec{\nabla} \cdot \vec{E} = 0 \\
\vec{\nabla} \times \vec{B} = \frac{1}{c^2} \frac{\partial\vec{E}}{\partial t}
$$

They become very simple to within the **Coulomb gauge**,
were we fix:

$$

\nabla \cdot \vec{A} = 0
$$

For the electric field we have:

$$
\vec{\nabla} \cdot \left(-\frac{\partial}{\partial t}A-\nabla \phi\right) = 0 \\
-\Delta \phi = 0
$$

This is solved through the boring solution $\phi = 0$.
For the magnetic field we obtain[^1]:

$$
\vec{\nabla} \times (\nabla \times \vec{A}) = -\frac{1}{c^2} \frac{\partial^2\vec{A}}{\partial t^2}\\
\nabla^2 \vec{A}  -\frac{1}{c^2} \frac{\partial^2\vec{A}}{\partial t^2}=0
$$

## Solution in terms of plane waves

We can directly solve the problem, by using the Fourier representation:

$$
\vec{A}(\vec{r}, t)= \frac{1}{(2\pi)^{3/2}}\int d^3\vec{k}\vec{A}(\vec{k},t)e^{i\vec{k}\vec{r}}
$$

We then find that the solutions fulfill the requirement:

$$
\left(\vec{k}^2 +\frac{1}{c^2} \frac{\partial^2}{\partial t^2}\right)\vec{A}(\vec{k},t)=0
$$

So the free radiation describes a travelling wave in the direction
$\vec{k}$. The coulomb gauge
[\[Eq:CouGauge\]](#Eq:CouGauge){reference-type="eqref"
reference="Eq:CouGauge"} further tells us that the vector potential only
has components, which are orthogonal to $\vec{k}$ as:

$$
\vec{k}\cdot\vec{A} = 0\\
\vec{A}(\vec{k}) = \vec{e}_1 A_1(\vec{k}) + \vec{e}_2 A_2(\vec{k})
$$

Given that these equations of motion for the vector potential look a lot
like the ones of a harmonic oscillator, let us go through the
quantization of the harmonic oscillator first.

# Quantization procedure for the harmonic oscillator {#Eq:QuantHO}

To the the problem, we first have to go back the cooking recipe for the
quantization of a classical problem. In a first step, we have to obtain
the relevant Lagrangian. Knowing what is it, is a rather interesting
artform of theoretical physics, but for most cases you might just take
it as a given thing. We have:

$$
L_{HO} = \frac{1}{2}m\dot{x}^2-\frac{m\omega^2}{2}x^2
$$

We can now identify the conjugate momentum as:

$$
p = \frac{\partial L}{\partial \dot{x}}\\
 = m\dot{x}
$$

At this stage we can calculate the Hamiltonian:

$$
H = \dot{x}p - L\\
H_{HO} = \frac{p^2}{2m}+\frac{m\omega^2}{2}x^2
$$

At this stage we can identify the classical equations of
motion through:

$$
\frac{dx}{dt}= \frac{\partial H}{\partial p}\\
\frac{dp}{dt}= -\frac{\partial H}{\partial x}
$$

It results just in the usual Newtons law. To get now the
quantum formulation, we can quantize the system by imposing the
commutation relationship on position and its conjugate momentum:

$$
~[\hat{x}, \hat{p}] = i\hbar
$$

We then had the final Hamiltonian:

$$
\hat{H} = \frac{\hat{p}^2}{2m}+\frac{m\omega^2}{2}\hat{x}^2
$$

However, we know from the previous lecture that it is
much nicer to work in the basis of raising and lowering operators:

$$
\hat{a} = \frac{1}{\sqrt{2\hbar}}\left(\sqrt{m\omega}x+i\frac{p}{\sqrt{m\omega}}\right)\\
\hat{a}^\dag = \frac{1}{\sqrt{2\hbar}}\left(\sqrt{m\omega}x-i\frac{p}{\sqrt{m\omega}}\right)\\
~[\hat{a}, \hat{a}^\dag] =1
$$

for which we obtain:

$$
\hat{H} =\hbar\omega\left(\hat{a}^\dag \hat{a}+\frac{1}{2}\right)
$$

# The lagrangien for the electromagnetism

At this stage we would like to roll out the formalism for
electromagnetism, following the discussion of Cohen-Tannoudji Vol 3
(appendix of 18) [@laloe2017]. It adds sequentially the following new
problems, which we will tackle as we get to them:

- The Lagrangien has plenty degrees of freedom.

- The dynamical variables are complex.

We start out with the Lagrangien:

$$
L = \int d^3r \mathcal{L}(\vec{r},t)\\
\mathcal{L}(\vec{r},t)= \frac{\epsilon_0}{2}\left(\vec{E}^2-c^2\vec{B}^2\right)
$$

As it depends explicitly on the electric and magnetic
field it is manifestly gauge invariant. However, the current version
does not allow us to to identify the conjugate variables. We will use
the vector potential to introduce them:

$$
\mathcal{L}(\vec{r},t)= \frac{\epsilon_0}{2}\left(\dot{\vec{A}}^2(\vec{r},t)-c^2\left(\nabla \times \vec{A}\right)^2\right)
$$

Now we obtained the time derivative, which we can employ
to identify the conjugate momentum, but it also gave us the unwanted rot
term. We get rid of them transforming into Fourier space: We can then
write:

$$
\int d\vec{r} \vec{E}(\vec{r},t)\vec{E}(\vec{r},t)= \int d\vec{k} \dot{\vec{A}}(\vec{k},t)\dot{\vec{A}}^*(\vec{k},t)\\
\int d\vec{r} \vec{B}(\vec{r},t)\vec{B}(\vec{r},t)= \int d\vec{k}k^2 \vec{A}(\vec{k},t)\vec{A}^*(\vec{k},t)\\
$$

We can then write the Lagrangien as:

$$
L = \int d^3k \mathcal{L}(\vec{k},t)\\
\mathcal{L}(\vec{k},t) = \epsilon_0\left( \dot{\vec{A}}(\vec{k},t)\dot{\vec{A}}^*(\vec{k},t)-c^2k^2 \vec{A}(\vec{k},t)\vec{A}^*(\vec{k},t)\right)
$$

As for the integral over $\vec{k}$, we will only
integrate over the positive contributions. This avoids summing over
identical terms at $\vec{k}$ and $-\vec{k}$. Finally, we can also use
the polarization [\[Eq:PotPolar\]](#Eq:PotPolar){reference-type="eqref"
reference="Eq:PotPolar"} to obtain:

$$
\mathcal{L}(\vec{k},t)= \epsilon_0\sum_i \left( \dot{A}_i(\vec{k},t)\dot{A}_i^*(\vec{k},t)-c^2k^2 A_i(\vec{k},t)A_i^*(\vec{k},t)\right)
$$

## The conjugate moment and hamiltonian

We have discussed in Sec. [2](#Eq:QuantHO){reference-type="ref"
reference="Eq:QuantHO"} how to find the conjugate momentum for classical
variables. Here, we have complex variables. But, we can deduce the
conjugate momentum through as decomposition $X = x_1 + i x_2$. We
actually obtain:

$$
P = \frac{\partial L}{\partial \dot{X}^*}
$$

Here, it implies that the conjugate momentum $\Pi_i(\vec{k})$ is

$$
\Pi_i(\vec{k}) = \frac{\partial\mathcal{L}(\vec{k},t)}{\partial \dot{A}^*_i(\vec{k},t)}\\
= \epsilon_0 \dot{A}_i(\vec{k},t)\\
= -\epsilon_0 E_i(\vec{k},t)
$$

**So the conjugate momentum to the vector potential is
the electric field.**

We can now calculate the Hamiltonian before we quantize the system. We
obtain:

$$
H = \sum_i \int d\vec{k}\left(\dot{A}_i(\vec{k},t)\Pi_i(\vec{k},t)+\dot{A}^*_i(\vec{k},t)\Pi^*_i(\vec{k},t)\right)-L
$$

We finally obtain the Hamiltonian of free radiation:

$$
H = \int d\vec{k} \mathcal{H}(\vec{k})\\
\mathcal{H}(\vec{k}) = \sum_i  \left(\frac{1}{\epsilon_0}\Pi_i^*(\vec{k},t)\Pi_i(\vec{k},t)+\epsilon_0c^2k^2 A^*_i(\vec{k},t)A_i(\vec{k},t)\right)
$$

## The quantized Hamiltonian

We are now ready to quantize the system, we simply have to be careful
about the quantization of the complex operators. Going through the
components, we obtain:

- $A_i^*\rightarrow \hat{A}_i^\dag$

- $A_i\rightarrow \hat{A}_i$

- $[\hat{A}_i(\vec{k}),\hat{\Pi}^\dag_j(\vec{k}')]= i\hbar \delta_{ij}\delta(\vec{k}-\vec{k}')$

Hence, the fully quantized Hamiltonian is:

$$
H = \int d\vec{k} \mathcal{H}(\vec{k})\\
\hat{\mathcal{H}}(\vec{k}) = \sum_i  \left(\frac{1}{\epsilon_0}\hat{\Pi}_i^\dag(\vec{k})\hat{\Pi}_i(\vec{k})+\epsilon_0c^2k^2 \hat{A}^\dag_i(\vec{k})\hat{A}_i(\vec{k})\right)\\
 = \epsilon_0 \sum_i  \left(\hat{E}_i^\dag(\vec{k})\hat{E}_i(\vec{k})+c^2k^2 \hat{A}^\dag_i(\vec{k})\hat{A}_i(\vec{k})\right)
$$

# The normal modes

The hamiltonian above looks roughly like a harmonic oscillator, but not
really yet as there are some funny conjugates trailing. This can get
solved through the definition of the appropiate raising and lowering
operators, named **normal modes**. They are defined through:

$$
\hat{a}_i(\vec{k}) = \sqrt{\frac{\epsilon_0 \omega}{2\hbar }}\left(\hat{A}_i(\vec{k})+\frac{i}{\epsilon_0\omega}\hat{\Pi}_i\right)\\
\hat{a}^\dag_i(\vec{k}) = \sqrt{\frac{\epsilon_0 \omega}{2\hbar }}\left(\hat{A}^\dag_i(\vec{k})-\frac{i}{\epsilon_0\omega}\hat{\Pi}_i^\dag \right)
$$

With the underlying commutation relationships of the
conjugate operators we obtain the usual raising and lowering operators:

$$
~[\hat{a}_i(\vec{k}), \hat{a}^\dag_j(\vec{k}')] =\delta_{ij}\delta(\vec{k}-\vec{k}')
$$

Multiplying it out brings the Hamiltonian in normal
form:

$$
H = \int d\vec{k} \mathcal{H}(\vec{k})\\
\hat{\mathcal{H}}(\vec{k}) = \sum_i  \frac{\hbar\omega_k}{2}\left(\hat{a}_i(\vec{k})\hat{a}_i^\dag(\vec{k})+\hat{a}_i^\dag(\vec{k})\hat{a}_i(\vec{k})\right)\\
= \sum_i \hbar\omega_k\left(\hat{a}^\dag_i(\vec{k})\hat{a}_i(\vec{k})+\frac{1}{2}\right)
$$

## Quadratures

It is common to push the terminology of the harmonic oscillator even
further, by the definition of the quadratures:

$$
\hat{a}_i(\vec{k}) = \frac{1}{\sqrt{\hbar2}}\left(\hat{Q}_i(\vec{k})+\hat{P}_i(\vec{k})\right)\\
\hat{a}^\dag_i(\vec{k}) =\frac{1}{\sqrt{\hbar2}}\left(\hat{Q}_i(\vec{k})-\hat{P}_i(\vec{k})\right)
$$

## The field operators

We can also express the actual field operators in terms of the normal
modes:

$$
\hat{E}(\vec{r})= i \int \frac{d\vec{k}}{(2\pi)^{3/2}}\sum_i \left(\frac{\hbar\omega}{2\epsilon_0}\right)\vec{e}_i\left(\hat{a}_i(\vec{k})e^{i\vec{k}\vec{r}}-\hat{a}^\dag_i(\vec{k})e^{-i\vec{k}\vec{r}}\right)\\
\hat{B}(\vec{r})= \frac{i}{c} \int \frac{d\vec{k}}{(2\pi)^{3/2}}\sum_i \left(\frac{\hbar\omega}{2\epsilon_0}\right)(\vec{k}\times\vec{e}_i)\left(\hat{a}_i(\vec{k})e^{i\vec{k}\vec{r}}-\hat{a}^\dag_i(\vec{k})e^{-i\vec{k}\vec{r}}\right)\\
\hat{A}(\vec{r})=  \int \frac{d\vec{k}}{(2\pi)^{3/2}}\sum_i \left(\frac{\hbar}{2\epsilon_0\omega}\right)\vec{e}_i\left(\hat{a}_i(\vec{k})e^{i\vec{k}\vec{r}}+\hat{a}^\dag_i(\vec{k})e^{-i\vec{k}\vec{r}}\right)
$$

In the following lectures we will typically focus on the electric field
as it couples to the electron charge through the electric dipole moment:

$$
H_I = \vec{D}\cdot\vec{E}
$$

This will be the content of the next lecture [@states].

# The notion of the photon

We can now get back to the interpretation of the eigenstates of the
raising and lowering operators as a photon. We have seen previously in
lecture 6[@Jendrzejewski] that the operator
$\hat{n}_i(\vec{k}) = \hat{a}_i^\dag (\vec{k}) \hat{a}_i(\vec{k})$ is
counting the occupation number in the Fock basis:

$$
\hat{n}_i(\vec{k}) \left|n_i\right\rangle= n_i\left|n_i\right\rangle
$$

The $n_i$ are then non-negative integers. We can further create a
well-defined photon number state through the raising operators from the
vacuum:

$$
\left|n\right\rangle = \frac{(a^\dag)^n}{\sqrt{n!}}\left|0\right\rangle
$$

Given all the numbers the single photon energy is
corresponding to intensities in the order pico to femto
Watts($\sim 10^{-12}$ -- $10^{-15}$W).

A rather nice discussion concerning the details of a proper quantization
of the interacting field theory of quantum electromagnetism is given in
the book by Kleinert [@electrodynamics]

[^1]:
    Remember
    $\vec{\nabla} \times (\nabla \times \vec{A}) =\nabla(\nabla \vec{A})-\nabla^2 \vec{A}$
