---
author:
  - Fred Jendrzejewski
  - Selim Jochim
order: 9
title: Lecture 9 - More on the Helium atom
---

We will finish our discussion of the Helium atom. Most importantly, we
will dive into the strong separation between singlet and triplet states.

In the last lecture, we saw some important properties
of the He atom:

- Total angular momentum, spin and the electronic quantum number are
  labelling the states.

- The exchange symmetry introduces the important distinction between
  ortho and para-states.

Today, we will see how this exchange symmetry enters the level scheme
and how it is linked to the spin.

# Level scheme

We can now continue through the level scheme of Helium and try to
understand our observations. No radiative transitions between $S=0$ and
$S=1$, which means that we will basically have two independent schemes.
They are characterized by:

- electronic excitations, which are the main quantum numbers $N$.

- orbital angular momentum, with quantum number $L$.

- total spin with quantum number $S$

- total angular momentum $J$, but the spin-orbit coupling in Helium is
  actually extremly small.

We will then use the term notation: $$N ^{2S+1}L_J$$ the superscript is
giving the multiplicity or the number of different $J$ levels.

Having the level structure, we are now able to calculate the energies of
the different states. We will start out with the ground state and then
work our way through the excited states.

# Independent particle model

We will now go back to the influence of the interaction on the
eigenenergies of the system. Going back to the Helium atoms, we will
treat the single particle Hamiltonians as unperturbed system and
$H_{12}$ as the perturbation:

$$
H_0 = -\frac{1}{2}\nabla_{r_1}^2 -\frac{Z}{r_1} -\frac{1}{2}\nabla_{r_2}^2 -\frac{Z}{r_2}\\
H_1 =\frac{1}{r_{12}}
$$

We now know the solutions to $H_0$, because the
factorize:

$$
\left(\hat{H}_1 + \hat{H}_2\right)|\psi_1\rangle\otimes|\psi_2\rangle =
\left(E_1 + E_2\right)|\psi_1\rangle\otimes|\psi_2\rangle
$$

## Groundstate energy - perturbative approach

At this stage we can try to calculate the groundstate energy. We can
derive that the unperturbed energy reads: $$E_0^{(0)}= Z^2\text{hartree}$$
The electron interaction leads within first order perturbation theory to
an energy shift of:
$$E_0^{(1)}= \langle\psi_0|\frac{1}{r_{12}}|\psi_0\rangle = \frac{5}{8}Z$$
We can see that the first order energy shift is actually not that small,
so we might start to question perturbation theory.

## Groundstate energy - variational approach

In the variational approach, we will try to find the minimal energy of
the ground state. Namely we will minimize:
$$E_{var} = \frac{\langle\psi|\hat{H}|\psi\rangle}{\langle\psi|\psi\rangle}$$
We can actually proof that this works nicely within a few lines. For
that we will expand our trial function $|\psi\rangle$ into the (unknown)
eigenstates of $\hat{H}$: $$|\psi\rangle = \sum_n c_n |\psi_n\rangle$$
For the energies this implies:
$$\hat{H}|\psi_n\rangle = E_n|\psi_n\rangle$$ So we end up with:

$$
\langle \psi|H|\psi\rangle - E_0 = \sum_n E_n c_n^*c_n - E_0 \sum_n c_n^*c_n\\
= \sum_n (E_n-E_0)|c_n|^2 \geq 0
$$

So the variational principle always gives an upper bound
on the ground state energy. The question is how good is this bound in
each individual case.

To apply the variational approach, we will introduce a variational
parameter. This parameter is typically guessed from physical intuition.
Here it will be the charge, which will be replaced by an _screened
charge_ $Z_{eff}$.

As variational wavefunction, we will employ the groundstate of the
hydrogen atom, which reads:

$$
\psi_{var}(r_1, r_2) = e^{-Z_{eff}(r_1+r_2)}
$$

We find then that the total energy is:
$$E_{var}^0 = Z_{eff}^2 -2ZZ_{eff}+\frac{5}{8}Z_{eff}$$ It becomes
minimal at

$$
Z_{eff} = Z- \frac{5}{16}
$$

So at this stage, we might compare the different levels
of approximation to the experimental result:

- The experimental observation is $E_{exp}^0=-2.90372$ hartree

- The independent particle model predicts $E^0 = -4$ hartree.

- First order pertubation theory predicts $E^0 = -2,709$ hartree.

- The variational principle predicts $E^0 = -2.84$ hartree.

The best theories achieve an accuracy of $10^{-7}$, see [Hertel 2015,
Chapter 7.2.5](http://dx.doi.org/10.1007/978-3-642-54322-7_7).

# Exchange Interaction

Up to now we focused on the ground state properties of the $1^
1S$ state. In the next step we will try to understand the influence of
the interaction term on the excited states (c.f. [Hertel 2015,
Chapter 7](http://dx.doi.org/10.1007/978-3-642-54322-7_7)). To attack this problem we will approach it pertubatively.

We saw that we could factorize the full wavefunction into external and
internal degrees of freedom. Further, we have the singlet $\chi_S$
(anti-symmetric) and triplet states $\chi_T$ (symmetric) for the spin.
This can now be combined too:

$$
\overline{\psi}_S(1,2) = \psi_{+}(r_1, r_2)\chi_S(1,2)\\
\overline{\psi}_T(1,2) = \psi_{-}(r_1, r_2)\chi_T(1,2)\\
$$

In a next step, we can construct $\psi_{\pm}$ from the eigenstates of
the unperturbed Hamiltonian. We define the states
$\left|q_1\right\rangle \equiv \left|n_1,l_1,m_1\right\rangle$
and
$\left|q_2\right\rangle \equiv \left|n_2,l_2,m_2\right\rangle$.
The properly symmetrized states are:

$$
\left|\psi_\pm\right\rangle = \frac{1}{\sqrt{2}}\left( \left|q_1\right\rangle_1 \otimes \left|q_2\right\rangle_2 \pm \left|q_2\right\rangle_1 \otimes \left|q_1\right\rangle_2 \right)
$$

Now we can perform an estimate of the energy shift on
these states.

$$
\Delta E_{S,T} = \left\langle\overline{\psi_{S,T} }\right|\frac{1}{\hat{r}_{12}} \left|\overline{\psi_{S,T}}\right\rangle\\
= \left\langle\psi_{+,- }\right|\frac{1}{\hat{r}_{12}} \left|\psi_{+,- }\right\rangle
$$

We then get

$$
\Delta E_{S,T} = \frac{1}{2} \left(\left\langle q_1 q_2 \right| \pm \left\langle q_2 q_1\right|\right) \left| \frac{1}{\hat{r}_{12}} \right| \left( \left|q_1 q_2\right\rangle \pm \left|q_2 q_1\right\rangle \right)\\
= \left\langle q_1 q_2\right| \frac{1}{\hat{r}_{12}}\left|q_1 q_2\right\rangle \pm \left\langle q_1 q_2\right| \frac{1}{\hat{r}_{12}} \left|q_2 q_1\right\rangle
$$

So we summarize:

$$
\Delta E_S = J_{nl} + K_{nl}\\
\Delta E_T = J_{nl} - K_{nl}
$$

The first term is called _direct_ (Coulomb) term and the second term is
known as _exchange_ term. If we integrate the direct term, we get:

$$
J_{nl} = \int \int \psi_{q_1}^*\left(\vec{r}_1\right) \psi_{q_2}^* \left(\vec{r}_2\right) \frac{1}{r_{12}} \psi_{q_1} \left(\vec{r}_1\right) \psi_{q_2} \left(\vec{r}_2\right) \mathop{}\!\mathrm{d}\vec{r}_1 \mathop{}\!\mathrm{d}\vec{r}_2 \\
= \int \int \left| \psi_{q_1} \left(\vec{r}_1\right) \right|^2 \left| \psi_{q_2}\left(\vec{r}_2\right) \right|^2 \frac{1}{r_{12}} \mathop{}\!\mathrm{d}\vec{r}_1 \mathop{}\!\mathrm{d}\vec{r}_2.
$$

This is Coulomb repulsion.

## Exchange term

The integration of the exchange term yields:

$$
K = \left\langle q_1 q_2\right| \frac{1}{r_{12}} \left|q_2 q_1\right\rangle = \int \psi_{q_1}^* \left(\vec{r}_1\right) \psi_{q_2}^* \left( \vec{r}_2 \right) \frac{1}{r_{12}} \psi_{q_2}\left(\vec{r}_1\right) \psi_{q_1} \left( \vec{r}_2 \right) \mathop{}\!\mathrm{d}\vec{r}_1 \mathop{}\!\mathrm{d}\vec{r}_2
$$

To understand it a bit better, we can rewrite it in a
more transparent way in terms of the spin operator, which measures the
difference between the singlet and the triplet state. Especially suited
is:

$$
\hat{\vec{S}}_1 \cdot \hat{\vec{S}}_2 = \frac{1}{2} \left(\hat{\vec{S}}^2 - \hat{\vec{S}}_1^2 - \hat{\vec{S}}_2^2 \right)\\
\hat{\vec{S}}_1 \cdot \hat{\vec{S}}_2 \chi_T = \frac{1}{4} \chi_T\\
\hat{\vec{S}}_1 \cdot \hat{\vec{S}}_2 \chi_S = -\frac{3}{4} \chi_S
$$

This allows us to rewrite the splitting in terms of an
effective Hamiltonian

$$
\hat{H}_\text{eff} = J_{nl} + \frac{1}{2}\left(1+ 4\hat{\vec{S}}_1 \cdot \hat{\vec{S}}_2\right) K_{nl}
$$

# Obtained energy shifts.

As an example, we have a look at the energy shifts (see figure below) for two electrons in the states defined by:

$$
q_1: n_1=1,l_1 = 0\\
q_2:_2=2,l_2= 0,1
$$

The $2^3S$ level for example corresponds to the state

$$
\frac{1}{\sqrt{2}} \left( \left|1s2s\right\rangle - \left|2s1s\right\rangle \right) \otimes \left|\uparrow \uparrow\right\rangle
$$

<img src="./lecture9_pic1.png" width="70%">

This splitting is in the order of 0.25eV and hence much larger than the
typical spin-orbit coupling. This explains, why the coupling to the
total angular momentum $J$ remains largely ignored for helium.

# Summary: Structure of the He Atom

- In the independent particle model, a state is determined by:

$$
    \left|n_1 l_1 m_1\right\rangle \otimes \left|n_2 l_2 m_2 \right\rangle



$$

- Only one electron can be electronically excited to a stable state.
  An excellent discussion of the auto-ionization can be found in [Sec.
  1.3 of Grynberg 2009](http://dx.doi.org/10.1017/cbo9780511778261). Thus, $N$ is the quantum number of the electronic excitation.

- Ignoring the spin degree of freedom, the eigenstates have a discrete
  symmetry with respect to particle exchange. The $\mathrm{He}$
  eigenstates are therefore either in a _triplet_ or in a _singlet_
  state. Here, we are talking about the symmetry with respect to the
  exchange of two particles. No inversion of space is done here! Why
  can we not assume a finite mass of the nucleui in order to describe
  two electrons by hydrogenic wave functions? The nucleus' motion
  would introduce an additional coupling term between the electrons

- The quantum number $L$ stands for the total orbital angular
  momentum.

- There is another conserved quantity we have not discussed yet: The
  total angular momentum

$$
    \hat{\vec{J}} = \hat{\vec{L}} + \hat{\vec{S}}.
$$

**Note.** For $\mathrm{^4He}$, there is no nuclear spin, meaning that there is no hyperfine structure.

Let us now have a look at the level scheme of the helium atom as depicted below.

**Note.** The general notation used in the figure below is

$$
N^{2S+1}L_J,
$$

where $2S+1$ denotes the multiplicity of the spin.

<img src="lecture9_pic2.png" width="70%">

Level scheme of singlet and triplet states of the helium atom from L=0
up to L=3. The ground state 1^1^S~0~ is chosen to have the energy E=0.
Taken from [Demtröder 2010](http://dx.doi.org/10.1007/978-3-642-10298-1).

- The fact that we can write the state down with a well-defined $S$
  and $L$ is called $LS$ or Russell-Saunders coupling. All $s_i$
  couple to $S = \sum_i s_i$ and all $l_j$ couple to $L=\sum_j l_j$.
  There is no coupling between the spin and the spatial degree of
  freedom!

<!-- -->

- We have introduced an effective spin interaction, but we have
  ignored the "real" interactions between the spins! What does it
  mean? How should we introduce it if we wanted to? How can we find
  out whether what we did is justifiable?

- The dipole interaction between two spins is

$$
    \sim\frac{\mu_0(g \mu_B/2)^2}{4\pi \hbar d^3} = \frac{\alpha^2}{4} \;(\text{a.u.})
$$

where $\mu_0 = 4\pi \alpha^2$, $\mu_B=1/2$,
$\hbar=1$, and $d\approx~a_0~=~1$. Compared to the energy difference
between $2^1S$ and $2^3S$, which is $>\alpha^2$ and on the order
of eV, it is a very small effect.

- Also, we have ignored the spin-orbit interaction of each electron
  between its own spin and its orbital angular momentum. From the
  hydrogen atom we know that the energy for the spin-orbit interaction

$$
    E_\textrm{ls} \propto (Z\alpha)^2
$$

is very strongly suppressed compared to the exchange interaction and the Coulomb repulsion.

**Note.** This will be different for heavy atoms, where $Z$ is large.

# Dipole Selection Rules in Helium

<img src="./lecture9_pic3.png" width="70%">

If helium atoms are excited in a gas discharge, one can see
characteristic emission lines as shown above (taken from [Wikipedia](https://en.wikipedia.org/wiki/Helium)).

<img src="./lecture9_pic4.png" width="70%">

Possible transitions within the singlet and triplet system of helium.
Taken from [Demtröder 2010](http://dx.doi.org/10.1007/978-3-642-10298-1).
The singlet and triplet levels are always plotted separately and there is no
transition between a singlet and a triplet state. Because of this
observation, people thought in the beginning that there were two
different types of helium ("para" and "ortho").

The rules for transitions to occur are determined by the dipole matrix
element containing the initial state $i$ and the final state $f$:

$$
\left\langle i|\hat{\vec{r}|f}\right\rangle.
$$

Due to the $LS$ coupling scheme, we get:

$$
\left|\psi(\vec{r_1, \vec{r}_2)}\right\rangle \otimes \left|\chi (1,2)\right\rangle.
$$

There is no entanglement between the degrees of freedom
and no mixed symmetry between spin and spatial degree of freedom! If we
plug this into the matrix element and multiply it out, we get, because the
operator $\hat{\vec{r}}$ does not act on the spin degree of freedom:

$$
\left\langle i|\hat{\vec{r}\,|f}\right\rangle = \left\langle\chi(1,2) | \chi'(1,2)\right\rangle \cdot \left\langle\psi(\vec{r_1, \vec{r}_2)|\hat{\vec{r}} \,| \psi'(\vec{r}_1, \vec{r}_2)}\right\rangle
$$

1.  The first factor has to be zero if the total spin is not the same.
    Then the relative alignment is not the same. Thus, there are no
    dipole transitions between singlet and triplet atoms!

2.  From the second factor we infer that transitions can only occur
    between states of opposite parity, e.g., $\Delta l = \pm 1$,
    together with angular momentum conservation.
