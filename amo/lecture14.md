---
author:
  - Fred Jendrzejewski
  - Selim Jochim
  - Matthias Weidemüller
order: 14
title: Lecture 14 - The spin in atoms with many electrons
---

In the last lecture we have seen that we can typically
treat complex atomic systems within the central field approximation.

$$
\hat{H} = \underbrace{\sum_i^N \left( \frac{1}{2} \vec{\nabla}^2_{\vec{r}_i} + V_\textrm{cf} (r_i) \right)}_{\hat{H}_0} + \underbrace{\sum^N_{j>i} \left( \frac{1}{r_{ij}} - S(r_i) \right)}_{\hat{H}_1}
$$

So we we can can treat atoms through the shell structure known from the
$\mathrm{H}$ atom, but the screening lifts the $l$ degeneracy. For a
single outer electron, we have even seen how this screening can be
described by the quantum defect.

We would now like to go beyond this simple picture and discuss the
following questions:

- How should the residual term $\hat{H}_1$ be taken into account?

- How do we properly take into account the Pauli principle ?

- How can we treat the fine-splitting ?

# On the residual coupling

If we ignore the residual coupling, we obtain a spherically symmetric
problem, which implies that the angular momentum $\vec{l}_i$ of each
electron is conserved. This conservation will be broken by
$\hat{H}_{1}$. However, these forces are internal, which implies that
the total angular momentum $\vec{L} = \sum_i \vec{l}_i$ is conserved. So
we should label the states in the complex Hamiltonian by $\vec{L}$.

The total angular momentum will then set the symmetry of the spatial
wavefunction. As already discussed in some detail for the He atom, this
has wide-reaching consquence on the spin degree of freedom through
exchange interaction.

# The Pauli principle and spin

- According to the Pauli principle, each single-particle state can be
  occupied only by one electron. After distributing all electrons over
  different single-particle eigenstates ("orbitals"), the resulting
  state needs to be fully antisymmetrized (Slater determinant).

- There is a simplification for atoms with many electrons: The angular
  momenta and spins of a complete subshell with
  $n,\,l,\,\{m_{-l},\cdots,m_l\}$ add to zero and can be ignored in
  the further considerations ("shell structure"). Note that this is
  often broken in molecular binding!

- Alkali atoms are the simplest atoms with shell structure: All but
  one _valence_ electron add to $L=0,S=0$. The ground state thus has
  $L=0,S=1/2$.

- For more complex atoms, the valence electrons couple to a total
  orbital angular momentum $L$ with a given symmetry according to
  particle exchange.

Let us have a look at two examples for light atoms, starting with
$\mathrm{He}$:

- $1s^2 \rightarrow L=0,S=0$. The corresponding term is $^1S$

- $1s2s \rightarrow L=0, \{S=0,S=1\}$. The corresponding terms are
  $^1S$ and $^3S$. .

The electronic configuration of $\mathrm{Si}$ is:

$$
\underbrace{1s^2 2s^2 2p^6 3s^2}_{L=0,\,S=0} 3p^2
$$

Per valence electron we have $l=1$ and $s=1/2$. So we
get $L=0,1,2$ and $S=0,1$. Here $S=1$ means symmetry and $S=0$
antisymmetry with respect to particle exchange. In principle we can form
the following terms:

$$
^1 S, ^3 S, ^1 P, ^3 P,^1 D,^3 D
$$

Which of these terms can be fully antisymmetrized? Here,
only the terms $^1S$, $^3P$ and $^1D$ fulfill Pauli's principle. In
general the exchange interaction (seen in the discussion of He), will
then lower the energy of the states with high spins.

## Optional: Symmetry of the $L$ states

We can construct the following $L$-states for them:

$$
\left|L=2,M_L=2\right\rangle = \left|\overbrace{1^{l_1},\overbrace{1}^{m_{l_1}};\overbrace{1}^{l_2},\overbrace{1}^{m_{l_2}}}\right\rangle
$$

$$
\left|L=1,M_L=0\right\rangle = \frac{1}{\sqrt{2}} ( \left|\overbrace{1^{m_{l_1}},\overbrace{-1}^{m_{l_2}}}\right\rangle - \left|-1,1 )\right\rangle
$$

$$
\left|L=0,M_L=0\right\rangle = \frac{1}{\sqrt{3}}(\left|\overbrace{1^{m_{l_1}},\overbrace{-1}^{m_{l_2}}}\right\rangle - \left|0,0\right\rangle + \left|-1,1\right\rangle )
$$

The first and third states are symmetric and the second state is antisymmetric with respect to particle
exchange.

# Fine splitting

We have already seen in the discussion of the hydrogen atom that
relativistic effects should be taken into account to fully understand
the level spectrum of different atoms. To take into account the spin, we
can decompose the Hamiltonian as follows:

$$

\hat{H} = \underbrace{\sum_i^N \left( \frac{1}{2} \vec{\nabla}^2_{\vec{r}_i} + V_\textrm{cf} (r_i) \right)}_{\hat{H}_0} + \underbrace{\sum^N_{j>i} \left( \frac{1}{r_{ij}} - S(r_i) \right)}_{\hat{H}_1} + \underbrace{\sum_i^N c_i(\vec{r}_i) \hat{\vec{L}}_i \cdot \hat{\vec{S}}_i}_{\hat{H}_2}
$$

The term $\hat{H}_0$ is from the central field and the
independent particle model. The Hamiltonian $\hat{H}_1$ results from the
residual electrostatic interaction and the Hamiltonian $\hat{H}_2$ comes
from the spin-orbit coupling of individual electrons.

The question is now which term dominates. Since
$\hat{H}_2 \propto (Z\alpha)^2$, we can ignore it if $Z$ is small. This
is the case for light atoms.

For our example this means that $^3P$ is the lowest energy state.
However, the triplet state has a multiplicity. Which are these states?
There has to be an additional degree of freedom. The total electronic
angular momentum $\hat{\vec{J}} = \hat{\vec{L}} + \hat{\vec{S}}$ of the
atom is a conserved quantity. The basis

$$
\left|L,S,M_\textrm{l},M_\textrm{s}\right\rangle
$$

is therefore not the right basis, since $M_\textrm{l}$
and $M_\textrm{s}$ are not conserved because of $LS$ coupling. The
correct basis is

$$
\left|L,S,J,M_\textrm{j}\right\rangle.
$$

Which $J$ corresponds to the ground state? If the
outermost shell is more than half filled, the maximum $J$ value is the
ground state, otherwise, the ground state has the minimum $J$ value. In
our example, $\mathrm{Si}$: $^3P_0$ is the ground state!

So far, we have been concerned with the "Russell-Saunders" coupling,
also known as $LS$ coupling. However, for atoms with large $Z$, the term
$\hat{H}_2$ in the Hamiltonian might become large, since it is
proportional to $(Z \alpha)^2$. We can ignore $\hat{H}_1$ instead.

According to $\hat{H}_2$ the individual electron orbital angular
momentum $l$ pairs with the spin $s$ of the same electron to form the
total electron angular momentum $j$. This will lead us to the concept of
$jj$ coupling. Let us consider carbon first (see
[1](#693186){reference-type="ref" reference="693186"}). The ground state
reads:

$$
\mathrm{C}: 1s^22s^22p^2.
$$

Let us consider one excited state:

$$
1s^22s^22p3s.
$$

<figure id="fig-ineff">
<img src="./lecture14_pic1.png" width="70%" />
</figure>

In the figure above "The splitting of levels in the first excited $^1$ P and $^3$P terms of
the carbon sequence. As $Z$ increases, the two electrons change their
character from being in an $LS$ coupled state to a $jj$ coupled state."
It is taken from <a href="http://www.pearson.com.au/products/A-C-Bransden-Joachain/Physics-of-Atoms-and-Molecules/9780582356924?R=9780582356924">Bransden</a>.

According to $LS$ coupling the total angular momentum of the two valence
electrons is $L=1$ and the total spin can be $S=0,1$. Thus, we should
expect a singlet and a triplet. For heavy atoms we can observe two
doublets instead of a singlet and a triplet. Because of the very strong
$\hat{\vec{L}}_i \cdot \hat{\vec{S}}_i$ coupling, $\hat{\vec{L}}$ and
$\hat{\vec{S}}$ are no longer conserved quantities. On the contrary,
$\hat{\vec{J}}$ still is a conserved quantity. In very heavy atoms,
$l_i$ and $s_i$ couple to $j_i$ for each electron $i$. In our example we
get

$$
l_1=0, s_1=\frac{1}{2} \qquad \text{and} \qquad l_2=1, s_2=\frac{1}{2}
$$

for electron $1$ and $2$ and thus

$$
j_1=\frac{1}{2} \qquad \text{and}\qquad j_2=\frac{1}{2},\frac{3}{2}.
$$

The individual $j_i$ couple to a total orbital angular
momentum $J$ in the following manner:

$$
J= \left\{ \begin{array}{ccc}0,1 & \text{for} & (j_1,j_2)=\left(\frac{1}{2},\frac{1}{2}\right)\\ && \\ 1,2 & \text{for} &(j_1,j_2) = \left(\frac{1}{2}, \frac{3}{2}\right) \end{array} \right.
$$

# Hyperfine splitting

Until now we have investigated the structure of the atom depending on:

- The orbital angular momentum $\vec{L}$, which defines the shells.

- The total electronic angular momentum $\vec{J} = \vec{L} + \vec{S}$,
  which defines the fine structure because of the spin-orbit coupling.

Further the nucleus has a spin angular momentum $\vec{I}$, which leads
to a magnetic moment:

$$
\vec{\mu}_I= g_I \mu_N \vec{I}
$$

We have introduced the new constants:

- $g_I$, which is always in the order of one, but it changes due to
  the changing structure of the different nuclei.

- The _nuclear magneton_
  $\mu_N = \frac{e\hbar}{2m_p}= \frac{m_e}{m_p}\mu_B$.

From the values of the prefactors, we can immediatly deduce that the
hyperfine structure will be roughly three orders of magnitude smaller
than the fine structure. As with the spin-orbit coupling this nuclear
spin will experience the magnetic field produced by the motion of the
electrons $\vec{B}_{el}$ and we have:

$$
H_{hfs} = -\vec{\mu}_I \cdot \vec{B}_{el}\\
= A_{hfs}\vec{I}\vec{J}
$$

This couples $\vec{I}$ and $\vec{J}$ and the full
structure is given by total angular momentum:

$$
\vec{F} = \vec{J} + \vec{I}
$$

## Hydrogen

In hydrogen the ground state has no angular momentum and the spin is
simply $S=1/2$. The nucleus has the same, such that we have $I=1/2$ and
the groundstate splits into the $F=0$ and the $F=1$ doublet. They are
separated by an energy difference of $1.42$GHz. This corresponds to a
transition wavelength of 21 cm, which is widely used in astronomy.

## Cesium clocks

The definition of time is based the hyperfine levels of Cs. Cs has just
one stable isotope Cs-133 with nuclear spin $I=7/2$. The ground state
electron is in the the 6s state in the $^2 S_{1/2}$ state. So the
groundstate splits into the $F=3$ and $F=4$ manifold. They are separated
by 9.4GHz and the clicking between these transitions is our definition
of time. The second is actually [defined as](https://www.physics.nist.gov/cuu/Units/current.html):

> The second is the duration of 9 192 631 770 periods of the radiation
> corresponding to the transition between the two hyperfine levels of
> the ground state of the cesium 133 atom.

All the other units have similiar definitions, except the embarrising
kilogram. It is defined as:

> The kilogram is the unit of mass; it is equal to the mass of the
> international prototype of the kilogram.

This will change soon as the member states of _Bureau International des
Poids et des Mesures_ decided to base the SI system on the measurement
of fundamental constants instead of some prototypes. So, now the
fundamental constants will have no errorbars left, as shown in Fig.
[2](#fig-si-units).

<figure id="fig-si-units">
<img src="./lecture14_pic2.png" width="95%" />
<figcaption>This wallet card displays the fundamental constants and other physical values that will define a revised international system of units. Taken
from <a href="http://https://www.nist.gov/si-redefinition/turning-point-humanity-redefining-worlds-measurement-system"> the Blog of
NIST</a>.</figcaption>
</figure>

## Bosonic and fermionic isotopes

A particularly interesting problem is the influence of the nuclear spin
on how the atoms talk to each other. For example we have two different
stable isotope of Li, namely Li $^6$ and Li$^7$, which only differ by one
neutron in the nucleus. All the wavelengths for controlling the atoms
are extremely similiar, however the hyperfine structure is different.
For Li$^6$ we have a nuclear spin of $I=1$ and for Li$^7$ $I=3/2$. The
resulting total angular momentum

- $F=1/2$ in the ground state of Li$^6$

- $F=1$ in the ground state of Li$^7$

So one is of them is an integer spin boson and the other one is a spin
half fermion. One can nicely see these differences as one tries to put
them onto each other for cold temperatures and tight traps as visualized
in the Figure below and reproduced from [Truscott 2001](http://dx.doi.org/10.1126/science.1059318).

<figure id="fig-fermi">
<img src="./lecture14_pic3.png" width="95%" />
</figure>
