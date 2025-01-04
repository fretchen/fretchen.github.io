---
author:
- Fred Jendrzejewski
- Selim Jochim
bibliography:
- bibliography/converted_to_latex.bib
date: January 04, 2025
nocite: "[@*]"
title: Lecture 5 - The Hydrogen Atom
---

In this lecture we will first discuss the diagonalization of the
harmonic oscillator and then discuss the main properties of the hydrogen
atom.

In the previous lectures we have seen how to treat eigenstates of the
two-level system and then how we can derive its effective emergence from
some complex level structure if we [apply oscillating
fields](https://www.authorea.com/users/143341/articles/326506-lecture-4-atoms-in-oscillating-fields).

Today, we will increase the complexity towards the harmonic oscillator
and the hydrogen atom.

# The harmonic oscillator

The harmonic oscillator is another great toy model to understand certain
properties of quantum mechanical systems. Most importantly, it is a
great introduction into the properties of bound systems and ladder
operators. The basic Hamiltonian comes along in a rather innocent
fashion, namely:

$$\begin{aligned}
\label{Eq:HamHO}
\hat{H} &= \frac{\hat{p}^2}{2m}+ \frac{m\omega^2}{2}\hat{x}^2
\end{aligned}$$ The two variables $\hat{p}$ and $\hat{x}$ are
non-commuting $[\hat{x}, \hat{p}] = i\hbar$, so they cannot be measured
at the same time. We would now like to put the operator into a diagonal
form such that it reads something like: $$\begin{aligned}
\label{Eq:HamHO}
\hat{H} &= \sum_n \epsilon_n \ensuremath{\left|n\right\rangle}\ensuremath{\left\langle n\right|}
\end{aligned}$$

We will follow he quite closely the discussion of Ref. [@interactions].

## The ladder operators

We would like to get the spectrum first. So make the equation look a bit
nicer we will define $\hat{p} = \hat{P} \sqrt{m\omega}$ and
$\hat{x} = \frac{\hat{X}}{\sqrt{m\omega}}$ such that we have:
$$\begin{aligned}
\label{Eq:HamHO}
\hat{H} &= \frac{\omega}{2}\left(\hat{P}^2 + \hat{X}^2\right)
\end{aligned}$$ [^1] The next step is then to define the ladder
operators: $$\begin{aligned}
\hat{a} = \frac{1}{\sqrt{2\hbar}}\left(\hat{X}+i\hat{P}\right)\\
\hat{a}^\dag = \frac{1}{\sqrt{2\hbar}}\left(\hat{X}-i\hat{P}\right)\\
\end{aligned}$$ At this stage we can just try to rewrite the Hamiltonian
in terms of the operators, such that: $$\begin{aligned}
\hat{a}^\dag \hat{a} &= \frac{1}{2\hbar}(\hat{X}-i\hat{P})(\hat{X}+i\hat{P})\\
&= \frac{1}{2\hbar}(\hat{X}^2 +\hat{P}^2 -\hbar)\\
 \frac{1}{2}(X^2 +\hat{P}^2 ) &= \hbar \left(\hat{a}^\dag \hat{a}-\frac{1}{2}\right)
\end{aligned}$$ So the Hamiltonian can now be written as:
$$\begin{aligned}
\hat{H} &= \hbar \omega \left(\hat{N} + \frac{1}{2}\right)\text{ with } \hat{N} = a^\dag a
\end{aligned}$$ At this stage we have diagonalized the Hamiltonian, what
remains to be understood is the the values that $\hat{a}^\dag a$ can
take.

## Action of the ladder operators in the Fock basis

We would like to understand the basis, which is defined by:
$$\begin{aligned}
\hat{N} \ensuremath{\left|n\right\rangle} = n \ensuremath{\left|n\right\rangle}
\end{aligned}$$ The non-commutation between $\hat{X}$ and $\hat{P}$ is
translated to the ladder operators as: $$\begin{aligned}
&= \frac{1}{2\hbar}[\hat{X}+iP,\hat{X}-i\hat{P}] = 1\\
~[\hat{N}, a] &= -\hat{a}\\
~[\hat{N}, a^\dag] &= a^\dag
\end{aligned}$$ From these relationship we can show then that:
$$\begin{aligned}
\hat{a}\ensuremath{\left|n\right\rangle} = \sqrt{n}\ensuremath{\left|n-1\right\rangle}\\
\hat{a}^\dag \ensuremath{\left|n\right\rangle} = \sqrt{n+1}\ensuremath{\left|n+1\right\rangle}\\
\end{aligned}$$ These relations are the motivation for the name ladder
operators as they connect the different eigenstates. And they are
raising/lowering the quantum number by one. Finally we have to find the
lower limit. And this is quite naturally 0 as
$n = \ensuremath{\left\langle n\right|}\hat{N}\ensuremath{\left|n\right\rangle} = \ensuremath{\left\langle\psi_1\right|}\ensuremath{\left|\psi_1\right\rangle}\geq 0$.
So we can construct the full basis by just defining the action of the
lowering operator on the zero element
$a\ensuremath{\left|0\right\rangle} = 0$ and the other operators are
then constructed as: $$\begin{aligned}
\ensuremath{\left|n\right\rangle} = \frac{(a^\dag)^n}{\sqrt{n!}}\ensuremath{\left|0\right\rangle}
\end{aligned}$$

## Spatial representation of the eigenstates

While we now have the spectrum it would be really nice to obtain the
spatial properties of the different states. For that we have to project
them onto the x basis. Let us start out with the ground state for which
we have $\hat{a}\ensuremath{\left|0\right\rangle}= 0$: $$\begin{aligned}
\ensuremath{\left\langle x\right|}\frac{1}{\sqrt{2\hbar}}\left(\sqrt{m\omega}\hat{x} +i \frac{1}{\sqrt{m\omega}}\hat{p}\right)\ensuremath{\left|0\right\rangle}= 0\\
\left(\sqrt{\frac{m\omega}{\hbar}}x + \sqrt{\frac{\hbar}{m\omega}}\partial_x\right)\psi_0(x)= 0\\
\Rightarrow \psi_0(x) \propto e^{-\frac{x^2}{2a_{HO}^2}}
\end{aligned}$$ This also introduces the typical distance in the quantum
harmonic oscillator which is given by $a_{HO} =\sqrt{\hbar/m\omega}$.
The other states are solutions to the defining equations:
$$\begin{aligned}
\psi_n(x) = \frac{1}{\sqrt{n!}2^n}\left(\sqrt{m\omega}x - \frac{1}{\sqrt{m\omega}}\frac{d}{dx}\right)^n \psi_0(x)\\
\psi_n(x) = \frac{1}{\sqrt{n!}2^n}H_n(x) \psi_0(x)\\
\end{aligned}$$ where $H_n(x)$ are the Hermite polynoms.

# The hamiltonian of the hydrogen atom

The hydrogen atom plays at central role in atomic physics as it is *the*
basic ingredient of atomic structures. It describes a single *electron*,
which is bound to the nucleus of a single *proton*. As such it is the
simplest of all atoms and can be described analytically within high
precision. This has motivated an enormous body of literature on the
problem, which derives all imaginable properties in nauseating detail.
Therefore, we will focus here on the main properties and only sketch the
derivations, while we will reference to the more technical details.

For the hydrogen atom as shown in [1](#261310){reference-type="ref"
reference="261310"}, we can write down the Hamiltonian $$\begin{aligned}
\hat{H}=\frac{{{\hat{\vec{p}}}^2_\text{p}}}{2m_\text{p}} + \frac{{\hat{\vec{p}}}^2_\text{e}}{2m_\text{e}} - \frac{Ze^2}{4\pi\epsilon_0 r},
\end{aligned}$$ where $Ze$ is the nuclear charge. To solve the problem,
we have to find the right Hilbert space. We can not solve the problem of
the electron alone. If we do a separation of coordinates, i.e., we
separate the Hamiltonian into the the center of mass and the relative
motion, we get $$\begin{aligned}
\hat{H} = \underbrace{\frac{{\hat{\vec{p}}}^2_{\textrm{cm}}}{2M}}_{\hat{H}_{\textrm{cm}}} + \underbrace{\frac{{\hat{\vec{p}}}^2_\text{r}}{2\mu}- \frac{Ze^2}{4\pi\epsilon_0r}}_{\hat{H}_{\text{atom}}} \label{eq:hydrogencmatomsplit}
\end{aligned}$$ with the reduced mass $1/\mu=1/m_\text{e}+1/m_\text{p}$.
If the state of the hydrogen atom $\ensuremath{\left|\psi\right\rangle}$
is an eigenstate of $\hat{H}$, we can write $$\begin{aligned}
\hat{H}\ensuremath{\left|\psi\right\rangle}=&\left( \hat{H}_\textrm{cm}+\hat{H}_{\text{atom}} \right)\ensuremath{\left|\psi_\textrm{cm}\right\rangle}\otimes \ensuremath{\left|\psi_\text{atom}\right\rangle} \label{eq:hydrogencmatom}\\
=& \left( E_{\text{kin}} + E_\text{atom} \right) \ensuremath{\left|\psi\right\rangle}.
\end{aligned}$$ Both states in
[\[eq:hydrogencmatom\]](#eq:hydrogencmatom){reference-type="eqref"
reference="eq:hydrogencmatom"} are eigenstates of the system. The state
$\ensuremath{\left|\psi\right\rangle}$ can be split up as shown since
the two degrees of freedom are generally not entangled.

![Sketch of the hydrogen atom with the relative coordinate and the
coordinates of the proton and the electron.
](figures/Bildschirmfoto-2018-09-28-um-16-07-07/Bildschirmfoto-2018-09-28-um-16-07-07){#261310
width="0.70\\columnwidth"}

The wave function of the system then reads: $$\begin{aligned}
\psi(\vec{R},\vec{r}) =& \left( \ensuremath{\left\langle R\right|} \otimes \ensuremath{\left\langle r\right|}\right)\left( \ensuremath{\left|\psi_\textrm{cm}\right\rangle} \otimes \ensuremath{\left|\psi_{\text{atom}}\right\rangle}\right)\\
=& \psi(\vec{R}) \cdot \psi (\vec{r})
\end{aligned}$$ Our goal is now to find the eigenfunctions and
eigenenergies of $\hat{H}_\text{atom}$. In order to further divide the
Hilbert space, we can use the symmetries.

# Conservation of orbital angular momentum

$\hat{H}_\text{atom}$ possesses spherical symmetry, which implies that
**orbital angular momentum** $\hat{\vec{L}}$ is conserved. It is defined
as: $$\begin{aligned}
\hat{\vec{L}}=\hat{\vec{r}} \times \hat{\vec{p}}
\end{aligned}$$ In other words, we have: $$\begin{aligned}
= 0
\end{aligned}$$ Let us show first that the kinetic term commutes with
the angular momentum operator, We will employ the commutator
relationships for position and momentum $[x_i, p_j]=i\hbar$ and the
relationship $[A,BC] = [A,B]C+B[A,C]$ and
$[f(x), p_x] = [x,p_x]\frac{\partial f(x)}{\partial x}$. So we obtain:
$$\begin{aligned}
&= [p_x^2,xp_y]-[p_y^2,yp_x] \\
 &= [p_x^2,x]p_y-[p_y^2,y] p_x\\
 &=i\hbar 2 p_xp_y-2i\hbar p_y p_x\\
 &= 0
\end{aligned}$$ Analog calculations show that $L_y$ and $L_z$ commute.
In a similiar fashion we can verify that the potential term commutes
with the different components of $\hat{\vec{L}}$ $$\begin{aligned}
&= [\frac{1}{r}, xp_y]-[\frac{1}{r}, yp_x]\\
&= x[\frac{1}{r}, p_y]-y[\frac{1}{r}, p_x]\\
&= -x \frac{yi\hbar}{2r^{3/2}}+y\frac{xi\hbar}{2r^{3/2}}\\
&=0
\end{aligned}$$ We can therefore decompose the eigenfunctions of the
hydrogen atom over the eigenbasis of the angular momentum operator. A
detailled discussion of the properties of $\vec{L}$ can be found in
Appendix B of [@Hertel_2015]. To find the eigenbasis, we first need to
identify the commutation relationships between the components of
$\hat{\vec{L}}$. We can calculate them following commutation
relationships: $$\begin{aligned}
&= [yp_z - zp_y, zp_x - xp_z]\\
&=[yp_z, zp_x]-[yp_z,xp_z]- [zp_y, zp_x] + [zp_y,xp_z]\\
&=[yp_z, zp_x] + [zp_y,xp_z]\\
&=[yp_z, z]p_x +x[zp_y,p_z]\\
&=-i\hbar yp_x +i\hbar xp_y\\
&= i\hbar L_z
\end{aligned}$$ This relationship holds for all the other components too
and we have in general: $$\begin{aligned}
= i\hbar \epsilon_{ijk}L_k
\end{aligned}$$ The orbital angular momentum is therefore part of the
large family of angular momentum operators, which also comprises spin
etc. In particular the different components are not independent, and
therefore we cannot form a basis out the three components. A suitable
choice is actually to use the following combinations: $$\begin{aligned}
\hat{\vec{L}}^2\ensuremath{\left|l,m_l\right\rangle} =& \hbar^2 l (l+1)\ensuremath{\left|l,m_l\right\rangle}\\
\hat{L}_z\ensuremath{\left|l,m_l\right\rangle} =& \hbar m_l \ensuremath{\left|l,m_l\right\rangle}
\end{aligned}$$

-   $l$ is a non-negative integer and it is called the **orbital angular
    momentum quantum number**.

-   $m_l$ takes values $-l, -l+1, ..., l-1, l$ and it is sometimes
    called the **projection of the angular momentum**.

## Eigenfunction of the angular momentum operators

Having identified the relevant operators it would be nice to obtain a
space representation of them. This works especially nicely in spherical
coordinates. There, we get $$\begin{aligned}
\hat{L}_z&= - i \hbar \partial_{\phi}\\
\hat{\vec{L}}^2 &= - \hbar^2 \left[\frac{1}{\sin(\theta)}\partial_{\theta} \left( \sin(\theta) \partial_\theta\right) + \frac{1}{\sin^2(\theta)} \partial_{\phi\phi} \right].
\end{aligned}$$ The corresponding wave functions are $$\begin{aligned}
\ensuremath{\left\langle\theta, \phi | l,m_l\right\rangle} = Y_{lm}(\theta,\phi).
\end{aligned}$$

Where $Y_{lm}(\theta, \phi)$ are the **spherical harmonics**.

# The radial wave equation

Given that we now know that the angular momentum is conserved for the
hydrogen atom, we can actually rewrite the Hamltonian
[\[eq:hydrogencmatomsplit\]](#eq:hydrogencmatomsplit){reference-type="ref"
reference="eq:hydrogencmatomsplit"} in terms of the angular momentum as
we find: $$\begin{aligned}
\hat{H}_\text{atom} = \hat{H}_r + \frac{\hat{L}}{2\mu r^2}+V(r) \\
\hat{H}_r = -\frac{\hbar^2}{2\mu}\frac{1}{r^2}\frac{\partial}{\partial r}\left(r^2\frac{\partial}{\partial r}\right)
\end{aligned}$$ We can now separate out the angular part and decompose
it over the eigenfunctions of $\hat{\vec{L}}$, such that we make the
ansatz [^2]: $$\begin{aligned}
\psi (r,\theta,\phi) = R(r) Y_{lm}(\theta,\phi)
\end{aligned}$$

We can plug this separated ansatz in the Schrödinger equation. We
already solved the angular in the discussion of the angular momentum and
for the radial part we obtain: $$\begin{aligned}
-\frac{\hbar^2}{2\mu}\frac{1}{r}\frac{d^2(rR(r))}{dr^2} - \frac{Ze^2}{4\pi\epsilon_0 r} R(r) + \frac{\hbar^2}{2\mu}\frac{l(l+1)}{r^2}R(r) = ER(r)
\end{aligned}$$ Substituting $R(r)=u(r)/r$ leads to $$\begin{aligned}
-\frac{\hbar^2}{2\mu}\frac{d^2}{dr^2}u(r) +\underbrace{ \left( -\frac{Ze^2}{4\pi\epsilon_0 r} + \frac{\hbar^2}{2\mu} \frac{l(l+1)}{r^2} \right)}_{V_{\text{eff}}} u(r) = E \, u(r),
\end{aligned}$$ which is known as the "radial wave equation". It is a
very general result for *any* central potential. It can also be used to
describe unbound states ($E>0$) that occur during scattering.

In the [next
lecture](https://www.authorea.com/users/143341/articles/326674-lecture-6-the-dipole-approximation-in-the-hydrogen-atom)
we will look into the energy scales of the hydrogen atom and then start
coupling different levels.

[^1]: The commutator between $\hat{X}$ and $\hat{P}$ is still as for $x$
    and $p$.

[^2]: Only if the system is in a well-defined angular momentum state, we
    can write it down like this.
