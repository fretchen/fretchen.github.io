---
author:
  - Fred Jendrzejewski
  - Selim Jochim
order: 8
title: Lecture 8 - The Helium atom
---

In this lecture we will discuss some basic properties of the Helium
atom. We will introduce first some useful notations for the specific
Hamiltonian at hand. Then we will focus on the important consequences
played by the electron-electron interaction on the spin structure and
the level scheme of the system. Finally, we will introduce the
variational method for the estimation of the ground state energy.

In todays lecture, we will see how the electron spin couples to the
orbital angular momentum and how this creates spin-orbit coupling. We
will then start out with the discussion of the Helium atom.

## Spin-orbit coupling

The third term, which arises from the Dirac equation is the spin-orbit
coupling. We will give here a common hand-waving explanation in a
similiar spirit to the discussion of the magnetic moment [for given
angular momentum](http://dx.doi.org/10.1007/978-3-642-10298-1). Please, be aware that it misses a
factor of 2. The electron has a spin 1/2 and hence a magnetic moment
$\vec{M}_S = -g_e \mu_B \frac{\vec{S}}{\hbar}$. This magnetic moment
experiences a magnetic field, simply due to the motion of the electron
charge itself. Assuming a circular motion of the electron, we obtain the
magnetic field amplitude:

$$
B = \frac{\mu_0 i}{2r}\\
B = \frac{\mu_0 ev}{4\pi r^2}\\
B = \frac{\mu_0 e}{4\pi m_e r^3}L\\
$$

Through the coupling with the spin and introducing a
fudge factor of 2 [^1], we obtain the Hamiltonian:

$$

\hat{H}_{LS} = \frac{g_e}{4\pi \epsilon_0}\frac{e^2}{2m_e^2c^2 r^3}  \hat{\vec{L}}\cdot \hat{\vec{S}}
$$

How does it act on a state $\left|\psi\right\rangle$? For
the example

$$
\left|\psi\right\rangle = \left|m_l\right\rangle \otimes \left|m_s\right\rangle
$$

we get:

$$
\hat{L}_z \cdot \hat{S}_z \left( \left|m_l\right\rangle \otimes \left|m_s\right\rangle \right)
= \hbar^2 m_l \cdot m_s (\left|m_l\right\rangle \otimes \left|m_s\right\rangle)
$$

The states

$$
\left|n,l,m_l\right\rangle \otimes \left|s,m_s\right\rangle.
$$

span the complete Hilbert space. Any state of the atom can be
represented by:

$$
\left|\psi\right\rangle = \sum_{\{n,l,m_l,m_s\}} c_{n,l,m_l,m_s} \left|n,l,m_l,m_s\right\rangle.
$$

As usual we can massively simplify the problem by using
the appropiate conserved quantities.

### Conservation of total angular momentum

We can look into it a bit further into the details and see that the
Hamiltonian $\hat{H}_\textrm{LS}$ does not commute with $\hat{L}_z$:

$$
= [L_z, L_x S_x + L_y S_y + L_z S_z]\\
[L_z, \vec{L}\cdot \vec{S}] = [L_z, L_x ]S_x + [L_z,  L_y  ]S_y\\
[L_z, \vec{L}\cdot \vec{S}] = i\hbar L_y S_x -i\hbar L_x S_y\neq 0
$$

This suggests that $L_z$ is not a good quantum number
anymore. We have to include the spin degree of freedom into the
description. Let us repeat the same procedure for the spin projection:

$$
= [S_z, L_x S_x + L_y S_y + L_z S_z]\\
[S_z, \vec{L}\cdot \vec{S}] = L_x [S_z,  S_x] + L_y [S_z,  S_y]\\
[S_z, \vec{L}\cdot \vec{S}] = i\hbar L_x S_y -i\hbar L_y S_x\neq 0
$$

This implies that the spin projection is not a conserved
quantity either. However, the sum of spin and orbital angular momentum
will commute $[L_z + S_z, \vec{L}\vec{S}] =0$ according to the above
calculations. Similiar calculations hold for the other components,
indicating that the _total angular momentum_ is conserved [^2]:

$$
\vec{J} = \vec{L} + \vec{S}
$$

We can now rewrite $\hat{H}_{LS}$ in terms of the conserved quantities through the following following
little trick:

$$
\hat{\vec{J}}^2 = \left( \hat{\vec{L}} + \hat{\vec{S}} \right) ^2 = \hat{\vec{L}}^2 + 2 \hat{\vec{L}} \cdot \hat{\vec{S}} + \hat{\vec{S}}^2\\
\hat{\vec{L}} \cdot \hat{\vec{S}} = \frac{1}{2} \left( \hat{\vec{J}}^2 - \hat{\vec{L}}^2 - \hat{\vec{S}}^2 \right)
$$

This directly implies that $\hat{J}^2$, $\hat{L}^2$ and $\hat{S}^2$ are
new conserved quantities of the system. If we call $\hat{H}_0$ the
Hamiltonian of the hydrogen atom, we previously used the complete set of
commuting observables [^3]:

$$
\left\{ \hat{H}_0, \hat{\vec{L}}^2, \hat{L}_z,\hat{\vec{S}}^2, \hat{S}_z \right\}
$$

We now use the complete set of commuting observables:

$$
\left\{ \hat{H}_0 + \hat{H}_{LS}, \hat{\vec{L}}^2,\hat{\vec{S}}^2, \hat{\vec{J}}^2, \hat{J}_z \right\}.
$$

The corresponding basis states
$\left|n,l,j,m_j\right\rangle$ are given by:

$$
\left|n,l,j,m_j\right\rangle = \sum_{m_l,m_s} \left|n, l, m_l, m_s\right\rangle \underbrace{\left\langle n, l, m_l, m_s | n, l, j, m_j\right\rangle}_{\text{Clebsch-Gordan coefficients}}
$$

Here, the Clebsch-Gordan coefficients (cf. [Olive 2014 p. 557](http://dx.doi.org/10.1088/1674-1137/38/9/090001) or the [PDG](http://pdg.lbl.gov/2002/clebrpp.pdf))
describe the coupling of angular momentum states.

**Example: $l=1$ and $s=1/2$.**

With the Clebsch-Gordan coefficients, the following example
states---given by $Jj$ and $m_j$---can be expressed by linear
combinations of states defined by $m_l$ and $m_s$:

$$
\left|j=\frac{3}{2}, m_j = \frac{3}{2}\right\rangle = \left|m_l=1, m_s = +\frac{1}{2}\right\rangle\\
\left|j=\frac{3}{2}, m_j = \frac{1}{2}\right\rangle = \sqrt{\frac{1}{3}} \left|m_l=1, m_s = -\frac{1}{2}\right\rangle +\sqrt{\frac{2}{3}} \left|m_l = 0, m_s = +\frac{1}{2}\right\rangle
$$

### Summary of the relativistic shifts

We can now proceed to a summary of the relativistic effects in the
hydrogen atom as presented in Fig.

<img src="./lecture8_pic1.png" width="70%"/>

Fine structure of the Hydrogen atom. Adapted from [Demtröder 2010 Fig. 5.33](http://dx.doi.org/10.1007/978-3-642-10298-1)

- The states should be characterized by angular momentum anymore, but
  by the total angular momentum $J$ and the orbital angular momentum.
  We introduce the notation:

$$
    nl_{j}
$$

- All shifts are on the order of $\alpha^2$ and hence pertubative.

- Some levels remain degenerate in relativistic theory, most
  importantly the $2s_{1/2}$ and the $2p_{1/2}$ state.

## The Lamb shift

The previous discussions studied the effects of the Dirac equation onto
our understanding of the Hydrogen atom. Most importantly, we saw that we
can test those predictions quite well through the shifts in the level
scheme. It is possible to push this analysis even further. One
particularly important candidate here are the degenerate levels
$2s_{1/2}$ and $2p_{1/2}$. Being able to see any splitting here, will be
proof physics beyond the Dirac equation. And it is a relative
measurement, for which it therefore not necessary to have insane
absolute precisions. It is exactly this measurement that [Lamb and
Retherford undertook in 1947](http://dx.doi.org/10.1103/physrev.72.241). They observed actually a
splitting of roughly $1$GHz, which they drove through direct
rf-transitions. The observed shift was immediately [explained by Bethe](http://dx.doi.org/10.1103/physrev.72.339) through the idea of QED a concept that we will come back
to later in this lecture in a much simpler context of cavity QED.

We would simply like to add here that the long story of the hydrogen
atom and the Lamb shift is far from over as open questions remained
until September 2019. Basically, a group of people measured the radius
in some 'heavy' muonic hydrogen very [precisely in 2010](http://dx.doi.org/10.1038/nature09250).
They could only explain them by changing the size of the proton radius,
which was previously assumed to be well measured. It was only this year
the another team reperformed a similiar measurement on electronic
hydrogen (the normal one), [obtaining consistent results](http://dx.doi.org/10.1126/science.aau7807). A nice summary of the \"proton radius puzzle\" can be
found [here](https://www.quantamagazine.org/physicists-finally-nail-the-protons-size-and-hope-dies-20190911/).

## The helium problem

In this lecture we will discuss the Helium atom and what makes it so
interesting in the laboratory. We will most importantly see that you
cannot solve the problem exactly. This makes it a great historical
example where a simple system was used to test state-of-the-art
theories. An extensive discussion can be found in Chapter 7 of Bransden [^Bransden] or [Chapter 6 of Demtröder 20210](http://dx.doi.org/10.1007/978-3-642-10298-1). Even nowadays, the system continues to be a nice test-bed of many-body theories, see for example the paper by [Combescot in 2017](http://dx.doi.org/10.1103/physrevx.7.041035) or by [Ott in 2019](http://dx.doi.org/10.1103/physrevlett.123.203401)..

The Helium atom describes a two electron system as shown in the figure
below.

<img src="./lecture8_pic2.svg" width="70%"/>

The helium atom describes two electrons coupled to the nucleus of
charge Z=2.

In the reference frame of center-of-mass we obtain the following
Hamiltonian:
$$H = -\frac{\hbar^2}{2\mu}\nabla_{r_1}^2 -\frac{\hbar^2}{2\mu}\nabla_{r_2}^2-\frac{\hbar^2}{M}\nabla_{r_1}\cdot\nabla_{r_2}+\frac{e^2}{4\pi \epsilon_0}\left(-\frac{Z}{r_1}-\frac{Z}{r_2}+\frac{1}{r_{12}}\right)$$

The term in the middle is the mass polarization term. We further
introduced the reduced mass $$\mu = \frac{m_eM}{m_e + M}$$ For the very
large mass differences $M= 7300 m_e \gg m_e$, we can do two
simplifications:

- Omit the term on the mass polarization.

- Set the reduced mass to the mass of the electron.

So we obtain the simplified Hamiltonian
$$H = -\frac{\hbar^2}{2m_e}\nabla_{r_1}^2 -\frac{\hbar^2}{2m_e}\nabla_{r_2}^2+\frac{e^2}{4\pi \epsilon_0}\left(-\frac{Z}{r_1}-\frac{Z}{r_2}+\frac{1}{r_{12}}\right)$$

## Natural units

For simplicity it is actually nice to work in the so-called **natural
units**, where we measure all energies and distance on typical scales.
We will start out by measuring all distances in units of $a_0$, which is
defined as:
$$a_0 = \frac{4\pi \epsilon_0 \hbar^2}{me^2} = 0.5\text{angstrom}$$ So
we can introduce the replacement: $$\mathbf{r} = \mathbf{\tilde{r}}a_0$$
So the Hamiltonian reads:

$$
H = -\frac{\hbar^2}{2m_ea_0^2}\nabla_{\tilde{r}_1}^2 -\frac{\hbar^2}{2m_ea_0^2}\nabla_{\tilde{r}_2}^2+\frac{e^2}{4\pi \epsilon_0 a_0}\left(-\frac{Z}{\tilde{r}_1}-\frac{Z}{\tilde{r}_2}+\frac{1}{\tilde{r}_{12}}\right)\\
H = -\frac{e^4 m}{2(4\pi\epsilon_0)^2 \hbar^2}\nabla_{\tilde{r}_1}^2 -\frac{e^4 m}{2(4\pi\epsilon_0)^2 \hbar^2}\nabla_{\tilde{r}_2}^2+\frac{e^4 m}{(4\pi \epsilon_0)^2\hbar^2}\left(-\frac{Z}{\tilde{r}_1}-\frac{Z}{\tilde{r}_2}+\frac{1}{\tilde{r}_{12}}\right)
$$

And finally we can measure all energies in units of
$$E_0 = \frac{e^4 m}{(4\pi\epsilon_0)^2\hbar^2} = 1\text{hartree} = 27.2\text{eV}$$
So the Hamiltonian reads in these natural units:

$$
\tilde{H} = -\frac{1}{2}\nabla_{\tilde{r}_1}^2 -\frac{1}{2}\nabla_{\tilde{r}_2}^2+\left(-\frac{Z}{\tilde{r}_1}-\frac{Z}{\tilde{r}_2}+\frac{1}{\tilde{r}_{12}}\right)
$$

Another, more common, way of introducing this is to define:

$$
m = \hbar = e = 4\pi \epsilon_0 \equiv 1\\
\alpha = \frac{e^2}{(4\pi \epsilon_0) \hbar c}= \frac{1}{137}\\
\Rightarrow c = \frac{1}{\alpha}
$$

Within these units we have for the hydrogen atom:
$$E_n = \frac{Z^2}{2}\frac{1}{n^2}E_0$$

**For the remainder of this lecture we will assume that we are working
in natural units and just omit the tildas.**

## Electron-electron interaction

Now we can decompose the Hamiltonian in the following fashion:
$$H = H_1 + H_2 + H_{12}$$ So without the coupling term between the
electrons we would just have once again two hydrogen atoms. The whole
crux is now that the term $H_{12}$ is actually coupling or
**entangling** the two electrons.

## Symmetries

The **exchange** operator is defined as:

$$
P_{12}\psi(r_1,r_2) = \psi(r_2, r_1)
$$

We directly see for the Hamiltonian of Helium in the reduced units that the exchange operator commutes with
the Hamiltonian, $[H,P_{12}] = 0$. This implies directly that the parity
is a conserved quantity of the system and that we have a set of
Eigenstates associated with the parity.

We can now apply the operator twice:

$$
P_{12}^2\psi(r_1,r_2) = \lambda^2 \psi(r_1, r_2) = \psi(r_1, r_2)
$$

So we can see that there are two sets of eigenvalues with
$\lambda = \pm 1$.

$$
P_{12}\psi_\pm = \pm \psi_\pm
$$

We will call:

- $\psi_+$ are para-states

- $\psi_-$ are ortho-states

This symmetry is a really strong one and it was only recently that
direct transitions between [ortho and para-states were observed](http://dx.doi.org/10.1103/physrevlett.119.173401). Interestingly, we did not need to look into the spin
and the Pauli principle for this discussion at all. This will happen in
the next step.

## Spin and Pauli principle

We have seen that the Hamiltonian does not contain the spin degree of
freedom. So we can decompose the total wave function as:

$$
\overline{\psi} = \psi(\mathbf{r}_1, \mathbf{r}_2) \cdot \chi(1,2)
$$

### Spin degree of freedom

Given that the electron is $s=\frac{1}{2}$, we can decompose each
wavefunction as:
$$\chi = \alpha |\uparrow\rangle + \beta |\downarrow\rangle$$ So if the
two spins were _not_ correlated, we could just write the spin
wavefunction as: $$\chi(1,2) = \chi_\mathrm{1}\cdot\chi_\mathrm{2}$$
However, the electron-electron interaction entangles the atoms. An
example would be the singlet state:
$$\chi(1,2) = \frac{1}{\sqrt{2}}\left(|\uparrow \downarrow\rangle - |\downarrow\uparrow \rangle\right)$$

To construct the full wave function we need to take into account the
_Pauli_ principle, which telles us for Fermions that the _full_
wavefunction should anti-sysmmetrc under exchange of particles:

$$
\overline{\psi}(q_1, q_2, \cdots, q_i,\cdots,  q_j, \cdots) =
-\overline{\psi}(q_1, q_2, \cdots, q_j,\cdots,  q_i, \cdots)
$$

This tells us that each quantum state can be only occupied by a single
electron at maximum.

Now we can come back to the full wavefunction using the results of the
previous section. We have:

$$
\overline{\psi}(1,2) = \psi_{\pm}(r_1,r_2)\chi_\mp(1,2)
$$

with
$P_{12}\chi_\pm = \pm \chi_\pm$. Now can once again look for good
solutions to this problem. It is basically the total spin
$\mathbf{S} = \mathbf{S}_1 + \mathbf{S}_2$, or better $\mathbf{S}^2$.
This commutes with both the Hamiltonian and the parity operator, so it
is a conserved quantity. Sorting out the solutions we have

$$

\chi*- = \frac{1}{\sqrt{2}}\left(|\uparrow\downarrow\rangle - |\downarrow\uparrow\rangle\right)\\
\chi*{+,1} = |\uparrow\uparrow\rangle \\
\chi*{+,1} = \frac{1}{\sqrt{2}}\left(|\uparrow\downarrow\rangle + |\downarrow\uparrow\rangle\right) \\
\chi*{+,-1} = |\downarrow\downarrow\rangle \\


$$

So $\chi_+$ is associated with spin 1 and $\chi_-$ is
associated with spin 0.

[^1]: It's proper derivation is left to quantum field theory lectures

[^2]: It should be as there is no external torque acting on the atom

[^3]: see lecture 2 for a few words on the definition of such a set

[^Bransden]: Brian Harold Bransden, Charles Jean Joachain. Physics of atoms and molecules. Pearson Education India, 2003.
