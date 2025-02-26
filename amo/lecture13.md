---
author:
  - Fred Jendrzejewski
  - Selim Jochim
  - Matthias Weidemüller
order: 13
title: Lecture 13 - Atoms with many electrons
---

After our discussion of extremely simple atoms like hydrogen and helium,
we will now discuss the most important properties of more complex atoms.
We will see, how we can categorize them and discuss some of the general
properties

We started the discussion of atoms in lecture 3 by an extremely simple
and powerful model, the two-level system . We then moved
on to discuss how it can emerge within the hydrogen atom and the Helium
atom. For both of these we dived again into simplified schemes.
Especially for Hydrogen, we saw in lecture 7 the exploding complexity of
the models as we tried to describe it. If we now want
to leave these rather academic problems and turn to the other widely
used atoms, molecules etc, we have towards effective models for two
reasons:

- Analytical solutions do not exist.

- Full numerical solutions become extremely and expansive.

A particularly instructive discussion of the ineffeciency of brute force
numerical methods was given by Kenneth Wilson, the father of the
renormalization group, in Sec 3 of [Wilson 1975](<http://dx.doi.org/10.1016/0001-8708(75)90149-8>).

<figure id="fig-toy">
<img src="./lecture13_pic1.png" width="70%" />
<figcaption>A toy model, exemplifying the problem of direct numerical analysis.</figcaption>
</figure>

The main idea is plotted in Fig. [1](#fig-toy) and its description in the words of Kenny Wilson can
be found in Fig. [2](#fig-ineff).

<figure id="fig-ineff">
<img src="./lecture13_pic2.png" width="95%" />
<figcaption>On the inefficiency of brute force numerics.</figcaption>
</figure>

We will come back to different experimental approaches to solve problems
for which we cannot devise effective theories at a later stage, when we
discuss quantum simulation and quantum computation with atomic systems.
But first we will try to gain a good understanding of atoms with many
electrons.

# Atoms with Many Electrons

As already discussed before, the N electron system cannot be solved in
its full complexity, so we have to walk through the different levels of
physical effects to understand what is going on. We will start out with
the simplest model, which consists of

- N electrons without spin

- Bound to the point-like nucleus of charge $Z$, which is supposed to
  be not moving.

In natural units, the Hamiltonian can be written as:

$$
\hat{H} = \sum_i^N \left(-\frac{1}{2} \vec{\nabla}^2_{r_i} - \frac{Z}{r_i} \right) + \sum_{i<j} \frac{1}{r_{ij}}.
$$

The system is visualized in Fig.
[3](#fig-three-ele).

<figure id="fig-three-ele">
<img src="./lecture13_pic3.png" width="70%" />
<figcaption>Charge distribution of three electrons bound to the nucleus.</figcaption>
</figure>

As before the Hamiltonian has two contributions:

- The well understood binding of each electron to the nucleus, which
  allows us to make the connection with the hydrogen orbitals.

- The interaction between the electrons, which couples all the
  orbitals.

How can we deal with the $1/r_{ij}$ terms? If many electrons are
contained in the system we cannot ignore the influence of the
electron-electron interaction on the system, which was already a
questionable approximation in the Helium atom.

# Central Field Approximation

But we can bring back the system to the well-known problems with
spherical symmetry by splitting the interaction into two parts. One will
be assumed to have spherical symmetry and will be written as
$\sum_i S(r_i)$ and the rest will be treated as a perturbation. So we
obtain the Hamiltonian:

$$
\hat{H} = \hat{H}_s + \hat{H}_1\\
\hat{H}_s = \sum_i^N \left(-\frac{1}{2} \vec{\nabla}^2_{r_i} + V_\textrm{cf}(r_i) \right)\\
V_\textrm{cf} (r_i) = - \frac{Z}{r_i} + S(r_i),
$$

The perturbation is then difference between the
spherically symmetric part of the interaction and the true
electron-electron interaction:

$$
\hat{H}_1 = \sum_{i<j} \frac{1}{r_{ij}} - \sum_i S(r_i)
$$

$S(r_i)$ describes now the screening of the nucleus due
to the other electrons. This function interpolates between (see
[4](#fig-screening)):

$$
V_\textrm{cf} (\vec{r}_i) = \left\{ \begin{array}{ccc} -\frac{Z}{r_i} &\text{for}& r\to 0 \\ \\ -\frac{Z-N+1}{r_i} & \text{for} & r\to\infty  \end{array} \right.
$$

- For very small distances the electron mainly sees the strong
  attraction of the nucleus.

- For very large distances the other electrons mostly screen the
  charge of the nucleus and electron feels the $1/r$ potential of the
  hydrogen atom.

<figure id="fig-screening">
<img src="./lecture13_pic4.png" width="70%" />
<figcaption>The screening as a function of distance.</figcaption>
</figure>

We can now focus on the study of the part with spherical symmetry
$\hat{H}_s$. Given its symmetry, we can once again use the conservation
of orbital angular momentum (see Lecture 5). As a
result, the wave function can be a product state of single-particle wave
functions:

$$
\psi_\textrm{cf} (\vec{r}_1 , \cdots , \vec{r}_\textrm{n} ) = \psi_1 (\vec{r}_1) \cdot \psi_2(\vec{r}_2) \cdot \cdots \psi_\textrm{n}(\vec{r}_\textrm{n}),
$$

where $\psi_i(\vec{r}_i)$ are solutions of the
Schrödinger equation:

$$
\left( - \frac{1}{2} \vec{\nabla}^2_{\vec{r}_i} + V_\textrm{cf} (r_i) \right) \psi_i (\vec{r}_i) = E_i \psi_i(\vec{r}_i).
$$

$\psi_i$ can be split up into a radial and an angular
part:

$$
\psi_i = \psi(nlm)_i = Y_{lm} (\theta, \varphi) \cdot R_{nl} (r).
$$

For the radial part we get $u(r) = r\cdot R(r)$. Thus,
$u(r)$ solves the radial Schrödinger equation:

$$
\left( - \frac{1}{2} \frac{d^2}{dr^2} + V_\textrm{cf}(r) + \frac{l(l+1)}{2r^2}\right) u_{nl} = E_{nl} u_{nl} (r).
$$

The major difference to the $\mathrm{H}$ atom is that
the degeneracy of the $l$ levels is lifted because of $V_\textrm{cf}$.

## On the determination of the effective potential

We will not discuss here the different techniques to derive the central
field in detail as this is quickly diving into the different numerical
techniques of many-body systems. A first discussion of the different
approaches can be found in chapter 10 of [Hertel 2015](http://dx.doi.org/10.1007/978-3-642-54322-7_10). The different
levels of sophistication are:

- The _Thomas-Fermi_ model, which assumes that the $N$ electrons
  behave like a Fermi gas inside the $Z/r$ potential.

- The Hartree method, in which the effective potential is iteratively
  recalculated based on the obtained solutions to the radial
  Schrödinger equation.

- The Hartree Fock method, in which we also take into account the
  proper symmetrization of the wavefunctions.

# Filling up the shells

If we can ignore the spin for the determination of the energy levels, we
have the following quantum numbers:

- $n$, which is electron shell.

- $l$, which is the orbital angular momentum with $l<n$.

- $s$, which is the spin of the electron and it can be $\pm 1/2$

As the electrons are fermions we can fill up each of the $nl$ states
with two of them. We then write down the configuration of the electron
by writing down the numbers of electrons per $nl$ configuration. So we
get the periodic table shown in Fig. [5](#783282){reference-type="ref"
reference="783282"}. We will typically use the following notation:

- A _configuration_ is the distribution of the electrons over the
  different orbits.

- Electrons with the same $n$ are part of the same _shell_.

- Electrons with the same $n$ and $l$ are part of the same
  _sub-shell_.

- The inner shells are typically filled and form the _core_.

- The outermost shell is typically named the _valence_ shell.

<figure id="fig-measure">
<img src="./lecture13_pic5.png" width="70%" />
<figcaption>Periodic table as taken from <a href="https://commons.wikimedia.org/wiki/File:Detailiertes_Periodensystem_mit_Elektronenkonfiguration.png">wiki commons</a> </figcaption>
</figure>

# Alkali Atoms

Alkali atoms are the simplest to understand and widely used in the field
of laser cooling. The electron configurations are

#### Examples.

- $\mathrm{Li}$: 1s$^2$ 2s

- $\mathrm{Na}$:
  1s$^2$ 2s$^2$ 2p$^6$ 3s

- $\mathrm{K}$:
  1s$^2$ 2s$^2$ 2p$^6$ 3s$^2$ 3p$^6$ 4s,
  so we fill up the 4s orbitals before the 3d orbitals.

- $\mathrm{Rb}$:
  1s$^2$ 2s$^2$ 2p$^6$ 3s$^2$ 3p$^6$ 3d$^{10}$ 4s$^2$ 4p$^6$ 5s,
  so we fill up the 5s orbitals before the 4d and 4f orbitals.

- $\mathrm{Cs}$:
  1s$^2$ 2s$^2$ 2p$^6$ 3s$^2$ 3p$^6$ 3d$^{10}$ 4s$^2$ 4p$^6$ 4d$^{10}$ 5s$^{2}$ 5p$^6$ 6s,
  so we fill up the 6s orbitals before the 4f, 5d and 5f orbitals.

This structure can be nicely understood by the idea of screening as
introduced in the central field approximation. Consider for example the
$\mathrm{Na}$ for which one electron has to be on the third shell.
Within the hydrogen atom the 3s, 3p and 3d are degenerate, however the
screening will lift this degeneracy.

- Electrons in the s-shell spend a lot of time close to the nucleus
  and fill a strong binding potential, i.e. they have a low energy.

- On the other extreme the electrons in the d-shell have large angular
  momentum, which hinders them from getting close to the core. The 10
  electrons can therefore efficiently screen the nucleus from the
  electron. The energy of the d shell is therefore quite close to the
  energy of the hydrogen atom.

For $\mathrm{K}$ the same principle applies.

- The 4s orbital is strongly shifted down to the strong nuclear
  potential.

- The 3d orbital is well screened by the other electrons, such that it
  is of higher energy than the 4s orbit.

We can describe this effect empirically through the _quantum defect_. We
simply write down the energy levels as:

$$
E_{nl} \cong -  R_{y,\infty} \cdot \left( \frac{1}{n-\delta_l} \right)^2,
$$

where $\delta_l$ is the quantum defect for a certain
value of $l$. Some examples are summarized in Fig.
[6](#fig-quantum-defect).

<figure id="fig-quantum-defect">
<img src="./lecture13_pic6.png" width="70%" />
<figcaption>The quantum defect for different alkali atoms. Table 3.4 from Hertel 2015. </figcaption>
</figure>

The effect of the quantum defect is actually so substantial that it
introduces optical transitions between the different subshells of Alkali
atoms.

- For Li there is a $2s\rightarrow 2p$ transition at 671 nm.

- For Na there is a $3s\rightarrow 3p$ transition at 589 nm.

- For K there is a $4s\rightarrow 4p$ transition at 767 nm and 770nm.

- For Rb there is a $5s\rightarrow 5p$ transition at 780 nm and at
  795nm.

- For Cs there is a $6s\rightarrow 6p$ transition at 852 nm and at
  894nm.

What is the origin of these doublets ? The scaling of the splitting with
the nucleus indicates relativistic origins and the splitting is indeed
due to spin-orbit coupling, which we will discuss in the next lecture.
