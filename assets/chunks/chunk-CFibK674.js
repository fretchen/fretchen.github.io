import{Cn as e}from"./chunk-YPwviyFJ.js";import{t}from"./chunk-BNReSP_g2.js";var n=e(),r=`/assets/static/lecture5_pic1.DJfcaMB1.png`,i={author:[`fretchen`,`Selim Jochim`],order:5,title:`Lecture 5 - The Hydrogen Atom`};function a(e){let i={a:`a`,code:`code`,em:`em`,h1:`h1`,h2:`h2`,li:`li`,ol:`ol`,p:`p`,pre:`pre`,section:`section`,strong:`strong`,sup:`sup`,ul:`ul`,...e.components};return(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)(i.p,{children:`In this lecture we will first discuss the diagonalization of the
harmonic oscillator and then discuss the main properties of the hydrogen
atom.`}),`
`,(0,n.jsx)(i.p,{children:`In the previous lectures we have seen how to treat eigenstates of the
two-level system and then how we can derive its effective emergence from
some complex level structure if we apply oscillating
fields.`}),`
`,(0,n.jsx)(i.p,{children:`Today, we will increase the complexity towards the harmonic oscillator
and the hydrogen atom.`}),`
`,(0,n.jsx)(i.h1,{children:`The harmonic oscillator`}),`
`,(0,n.jsx)(i.p,{children:`The harmonic oscillator is another great toy model to understand certain
properties of quantum mechanical systems. Most importantly, it is a
great introduction into the properties of bound systems and ladder
operators. The basic Hamiltonian comes along in a rather innocent
fashion, namely:`}),`
`,(0,n.jsx)(i.pre,{children:(0,n.jsx)(i.code,{className:`language-math math-display`,children:`
\\hat{H} = \\frac{\\hat{p}^2}{2m}+ \\frac{m\\omega^2}{2}\\hat{x}^2`})}),`
`,(0,n.jsxs)(i.p,{children:[`The two variables `,(0,n.jsx)(i.code,{className:`language-math math-inline`,children:`\\hat{p}`}),` and `,(0,n.jsx)(i.code,{className:`language-math math-inline`,children:`\\hat{x}`}),` are
non-commuting `,(0,n.jsx)(i.code,{className:`language-math math-inline`,children:`[\\hat{x}, \\hat{p}] = i\\hbar`}),`, so they cannot be measured
at the same time. We would now like to put the operator into a diagonal
form such that it reads something like:`]}),`
`,(0,n.jsx)(i.pre,{children:(0,n.jsx)(i.code,{className:`language-math math-display`,children:`
\\hat{H} = \\sum_n \\epsilon_n \\left|n\\right\\rangle\\left\\langle n\\right|`})}),`
`,(0,n.jsxs)(i.p,{children:[`We will follow he quite closely `,(0,n.jsx)(i.a,{href:`https://ocw.mit.edu/courses/nuclear-engineering/22-51-quantum-theory-of-radiation-interactions-fall-2012/lecture-notes/MIT22_51F12_Ch9.pdf`,children:`this discussion`}),`.`]}),`
`,(0,n.jsx)(i.h2,{children:`The ladder operators`}),`
`,(0,n.jsxs)(i.p,{children:[`We would like to get the spectrum first. So make the equation look a bit
nicer we will define `,(0,n.jsx)(i.code,{className:`language-math math-inline`,children:`\\hat{p} = \\hat{P} \\sqrt{m\\omega}`}),` and
`,(0,n.jsx)(i.code,{className:`language-math math-inline`,children:`\\hat{x} = \\frac{\\hat{X}}{\\sqrt{m\\omega}}`}),` such that we have:`]}),`
`,(0,n.jsx)(i.pre,{children:(0,n.jsx)(i.code,{className:`language-math math-display`,children:`
\\hat{H} = \\frac{\\omega}{2}\\left(\\hat{P}^2 + \\hat{X}^2\\right)`})}),`
`,(0,n.jsxs)(i.p,{children:[(0,n.jsx)(i.sup,{children:(0,n.jsx)(i.a,{href:`#user-content-fn-1`,id:`user-content-fnref-1`,"data-footnote-ref":!0,"aria-describedby":`footnote-label`,children:`1`})}),` The next step is then to define the ladder
operators:`]}),`
`,(0,n.jsx)(i.pre,{children:(0,n.jsx)(i.code,{className:`language-math math-display`,children:`\\hat{a} = \\frac{1}{\\sqrt{2\\hbar}}\\left(\\hat{X}+i\\hat{P}\\right)\\\\
\\hat{a}^\\dag = \\frac{1}{\\sqrt{2\\hbar}}\\left(\\hat{X}-i\\hat{P}\\right)\\\\`})}),`
`,(0,n.jsx)(i.p,{children:`At this stage we can just try to rewrite the Hamiltonian
in terms of the operators, such that:`}),`
`,(0,n.jsx)(i.pre,{children:(0,n.jsx)(i.code,{className:`language-math math-display`,children:`\\hat{a}^\\dag \\hat{a} = \\frac{1}{2\\hbar}(\\hat{X}-i\\hat{P})(\\hat{X}+i\\hat{P})\\\\
= \\frac{1}{2\\hbar}(\\hat{X}^2 +\\hat{P}^2 -\\hbar)\\\\
 \\frac{1}{2}(X^2 +\\hat{P}^2 ) = \\hbar \\left(\\hat{a}^\\dag \\hat{a}-\\frac{1}{2}\\right)`})}),`
`,(0,n.jsx)(i.p,{children:`So the Hamiltonian can now be written as:`}),`
`,(0,n.jsx)(i.pre,{children:(0,n.jsx)(i.code,{className:`language-math math-display`,children:`\\hat{H} = \\hbar \\omega \\left(\\hat{N} + \\frac{1}{2}\\right)\\text{ with } \\hat{N} = a^\\dag a`})}),`
`,(0,n.jsxs)(i.p,{children:[`At this stage we have diagonalized the Hamiltonian, what
remains to be understood is the the values that `,(0,n.jsx)(i.code,{className:`language-math math-inline`,children:`\\hat{a}^\\dag a`}),` can
take.`]}),`
`,(0,n.jsx)(i.h2,{children:`Action of the ladder operators in the Fock basis`}),`
`,(0,n.jsx)(i.p,{children:`We would like to understand the basis, which is defined by:`}),`
`,(0,n.jsx)(i.pre,{children:(0,n.jsx)(i.code,{className:`language-math math-display`,children:`\\hat{N} \\left|n\\right\\rangle = n \\left|n\\right\\rangle`})}),`
`,(0,n.jsxs)(i.p,{children:[`The non-commutation between `,(0,n.jsx)(i.code,{className:`language-math math-inline`,children:`\\hat{X}`}),` and `,(0,n.jsx)(i.code,{className:`language-math math-inline`,children:`\\hat{P}`}),` is
translated to the ladder operators as:`]}),`
`,(0,n.jsx)(i.pre,{children:(0,n.jsx)(i.code,{className:`language-math math-display`,children:`= \\frac{1}{2\\hbar}[\\hat{X}+iP,\\hat{X}-i\\hat{P}] = 1\\\\
~[\\hat{N}, a] = -\\hat{a}\\\\
~[\\hat{N}, a^\\dag] = a^\\dag`})}),`
`,(0,n.jsx)(i.p,{children:`From these relationship we can show then that:`}),`
`,(0,n.jsx)(i.pre,{children:(0,n.jsx)(i.code,{className:`language-math math-display`,children:`\\hat{a}\\left|n\\right\\rangle = \\sqrt{n}\\left|n-1\\right\\rangle\\\\
\\hat{a}^\\dag \\left|n\\right\\rangle = \\sqrt{n+1}\\left|n+1\\right\\rangle\\\\`})}),`
`,(0,n.jsxs)(i.p,{children:[`These relations are the motivation for the name ladder
operators as they connect the different eigenstates. And they are
raising/lowering the quantum number by one. Finally we have to find the
lower limit. And this is quite naturally 0 as
`,(0,n.jsx)(i.code,{className:`language-math math-inline`,children:`n = \\left\\langle n\\right|\\hat{N}\\left|n\\right\\rangle = \\left\\langle\\psi_1\\right|\\left|\\psi_1\\right\\rangle\\geq 0`}),`.
So we can construct the full basis by just defining the action of the
lowering operator on the zero element
`,(0,n.jsx)(i.code,{className:`language-math math-inline`,children:`a\\left|0\\right\\rangle = 0`}),` and the other operators are
then constructed as:`]}),`
`,(0,n.jsx)(i.pre,{children:(0,n.jsx)(i.code,{className:`language-math math-display`,children:`\\left|n\\right\\rangle = \\frac{(a^\\dag)^n}{\\sqrt{n!}}\\left|0\\right\\rangle`})}),`
`,(0,n.jsx)(i.h2,{children:`Spatial representation of the eigenstates`}),`
`,(0,n.jsxs)(i.p,{children:[`While we now have the spectrum it would be really nice to obtain the
spatial properties of the different states. For that we have to project
them onto the x basis. Let us start out with the ground state for which
we have `,(0,n.jsx)(i.code,{className:`language-math math-inline`,children:`\\hat{a}\\left|0\\right\\rangle= 0`}),`:`]}),`
`,(0,n.jsx)(i.pre,{children:(0,n.jsx)(i.code,{className:`language-math math-display`,children:`\\left\\langle x\\right|\\frac{1}{\\sqrt{2\\hbar}}\\left(\\sqrt{m\\omega}\\hat{x} +i \\frac{1}{\\sqrt{m\\omega}}\\hat{p}\\right)\\left|0\\right\\rangle= 0\\\\
\\left(\\sqrt{\\frac{m\\omega}{\\hbar}}x + \\sqrt{\\frac{\\hbar}{m\\omega}}\\partial_x\\right)\\psi_0(x)= 0\\\\
\\Rightarrow \\psi_0(x) \\propto e^{-\\frac{x^2}{2a_{HO}^2}}`})}),`
`,(0,n.jsxs)(i.p,{children:[`This also introduces the typical distance in the quantum
harmonic oscillator which is given by `,(0,n.jsx)(i.code,{className:`language-math math-inline`,children:`a_{HO} =\\sqrt{\\hbar/m\\omega}`}),`.
The other states are solutions to the defining equations:`]}),`
`,(0,n.jsx)(i.pre,{children:(0,n.jsx)(i.code,{className:`language-math math-display`,children:`\\psi_n(x) = \\frac{1}{\\sqrt{n!}2^n}\\left(\\sqrt{m\\omega}x - \\frac{1}{\\sqrt{m\\omega}}\\frac{d}{dx}\\right)^n \\psi_0(x)\\\\
\\psi_n(x) = \\frac{1}{\\sqrt{n!}2^n}H_n(x) \\psi_0(x)\\\\`})}),`
`,(0,n.jsxs)(i.p,{children:[`where `,(0,n.jsx)(i.code,{className:`language-math math-inline`,children:`H_n(x)`}),` are the Hermite polynoms.`]}),`
`,(0,n.jsx)(i.h1,{children:`The hamiltonian of the hydrogen atom`}),`
`,(0,n.jsxs)(i.p,{children:[`The hydrogen atom plays at central role in atomic physics as it is `,(0,n.jsx)(i.em,{children:`the`}),`
basic ingredient of atomic structures. It describes a single `,(0,n.jsx)(i.em,{children:`electron`}),`,
which is bound to the nucleus of a single `,(0,n.jsx)(i.em,{children:`proton`}),`. As such it is the
simplest of all atoms and can be described analytically within high
precision. This has motivated an enormous body of literature on the
problem, which derives all imaginable properties in nauseating detail.
Therefore, we will focus here on the main properties and only sketch the
derivations, while we will reference to the more technical details.`]}),`
`,(0,n.jsx)(t,{id:`fig-hydrogen-atom-sketch`,href:r,caption:`Sketch of the hydrogen atom with the relative coordinate and the coordinates of the proton and the electron`}),`
`,(0,n.jsx)(i.p,{children:`For the hydrogen atom as shown in above, we can write down the Hamiltonian`}),`
`,(0,n.jsx)(i.pre,{children:(0,n.jsx)(i.code,{className:`language-math math-display`,children:`\\hat{H}=\\frac{{{\\hat{\\vec{p}}}^2_\\text{p}}}{2m_\\text{p}} + \\frac{{\\hat{\\vec{p}}}^2_\\text{e}}{2m_\\text{e}} - \\frac{Ze^2}{4\\pi\\epsilon_0 r},`})}),`
`,(0,n.jsxs)(i.p,{children:[`where `,(0,n.jsx)(i.code,{className:`language-math math-inline`,children:`Ze`}),` is the nuclear charge. To solve the problem,
we have to find the right Hilbert space. We can not solve the problem of
the electron alone. If we do a separation of coordinates, i.e., we
separate the Hamiltonian into the the center of mass and the relative
motion, we get`]}),`
`,(0,n.jsx)(i.pre,{children:(0,n.jsx)(i.code,{className:`language-math math-display`,children:`\\hat{H} = \\underbrace{\\frac{{\\hat{\\vec{p}}}^2_{\\textrm{cm}}}{2M}}_{\\hat{H}_{\\textrm{cm}}} + \\underbrace{\\frac{{\\hat{\\vec{p}}}^2_\\text{r}}{2\\mu}- \\frac{Ze^2}{4\\pi\\epsilon_0r}}_{\\hat{H}_{\\text{atom}}}`})}),`
`,(0,n.jsxs)(i.p,{children:[`with the reduced mass `,(0,n.jsx)(i.code,{className:`language-math math-inline`,children:`1/\\mu=1/m_\\text{e}+1/m_\\text{p}`}),`.
If the state of the hydrogen atom `,(0,n.jsx)(i.code,{className:`language-math math-inline`,children:`\\left|\\psi\\right\\rangle`}),`
is an eigenstate of `,(0,n.jsx)(i.code,{className:`language-math math-inline`,children:`\\hat{H}`}),`, we can write`]}),`
`,(0,n.jsx)(i.pre,{children:(0,n.jsx)(i.code,{className:`language-math math-display`,children:`\\hat{H}\\left|\\psi\\right\\rangle=\\left(\\hat{H}_\\textrm{cm}+\\hat{H}_{\\text{atom}} \\right)\\left|\\psi_\\textrm{cm}\\right\\rangle\\otimes \\left|\\psi_\\text{atom}\\right\\rangle \\\\
= \\left( E_{\\text{kin}} + E_\\text{atom} \\right) \\left|\\psi\\right\\rangle.`})}),`
`,(0,n.jsxs)(i.p,{children:[`Both states are eigenstates of the system. The state
`,(0,n.jsx)(i.code,{className:`language-math math-inline`,children:`\\left|\\psi\\right\\rangle`}),` can be split up as shown since
the two degrees of freedom are generally not entangled.`]}),`
`,(0,n.jsx)(i.p,{children:`The wave function of the system then reads:`}),`
`,(0,n.jsx)(i.pre,{children:(0,n.jsx)(i.code,{className:`language-math math-display`,children:`\\psi(\\vec{R},\\vec{r}) = \\left( \\left\\langle R\\right| \\otimes \\left\\langle r\\right|\\right)\\left( \\left|\\psi_\\textrm{cm}\\right\\rangle \\otimes \\left|\\psi_{\\text{atom}}\\right\\rangle\\right)\\\\
= \\psi(\\vec{R}) \\cdot \\psi (\\vec{r})`})}),`
`,(0,n.jsxs)(i.p,{children:[`Our goal is now to find the eigenfunctions and
eigenenergies of `,(0,n.jsx)(i.code,{className:`language-math math-inline`,children:`\\hat{H}_\\text{atom}`}),`. In order to further divide the
Hilbert space, we can use the symmetries.`]}),`
`,(0,n.jsx)(i.h1,{children:`Conservation of orbital angular momentum`}),`
`,(0,n.jsxs)(i.p,{children:[(0,n.jsx)(i.code,{className:`language-math math-inline`,children:`\\hat{H}_\\text{atom}`}),` possesses spherical symmetry, which implies that
`,(0,n.jsx)(i.strong,{children:`orbital angular momentum`}),` `,(0,n.jsx)(i.code,{className:`language-math math-inline`,children:`\\hat{\\vec{L}}`}),` is conserved. It is defined
as:`]}),`
`,(0,n.jsx)(i.pre,{children:(0,n.jsx)(i.code,{className:`language-math math-display`,children:`\\hat{\\vec{L}}=\\hat{\\vec{r}} \\times \\hat{\\vec{p}}`})}),`
`,(0,n.jsx)(i.p,{children:`In other words, we have:`}),`
`,(0,n.jsx)(i.pre,{children:(0,n.jsx)(i.code,{className:`language-math math-display`,children:`= 0`})}),`
`,(0,n.jsxs)(i.p,{children:[`Let us show first that the kinetic term commutes with
the angular momentum operator, We will employ the commutator
relationships for position and momentum `,(0,n.jsx)(i.code,{className:`language-math math-inline`,children:`[x_i, p_j]=i\\hbar`}),` and the
relationship `,(0,n.jsx)(i.code,{className:`language-math math-inline`,children:`[A,BC] = [A,B]C+B[A,C]`}),` and
`,(0,n.jsx)(i.code,{className:`language-math math-inline`,children:`[f(x), p_x] = [x,p_x]\\frac{\\partial f(x)}{\\partial x}`}),`. So we obtain:`]}),`
`,(0,n.jsx)(i.pre,{children:(0,n.jsx)(i.code,{className:`language-math math-display`,children:`= [p_x^2,xp_y]-[p_y^2,yp_x] \\\\
 = [p_x^2,x]p_y-[p_y^2,y] p_x\\\\
 =i\\hbar 2 p_xp_y-2i\\hbar p_y p_x\\\\
 = 0`})}),`
`,(0,n.jsxs)(i.p,{children:[`Analog calculations show that `,(0,n.jsx)(i.code,{className:`language-math math-inline`,children:`L_y`}),` and `,(0,n.jsx)(i.code,{className:`language-math math-inline`,children:`L_z`}),` commute.
In a similiar fashion we can verify that the potential term commutes
with the different components of `,(0,n.jsx)(i.code,{className:`language-math math-inline`,children:`\\hat{\\vec{L}}`})]}),`
`,(0,n.jsx)(i.pre,{children:(0,n.jsx)(i.code,{className:`language-math math-display`,children:`= [\\frac{1}{r}, xp_y]-[\\frac{1}{r}, yp_x]\\\\
= x[\\frac{1}{r}, p_y]-y[\\frac{1}{r}, p_x]\\\\
= -x \\frac{yi\\hbar}{2r^{3/2}}+y\\frac{xi\\hbar}{2r^{3/2}}\\\\
=0`})}),`
`,(0,n.jsxs)(i.p,{children:[`We can therefore decompose the eigenfunctions of the
hydrogen atom over the eigenbasis of the angular momentum operator. A
detailled discussion of the properties of `,(0,n.jsx)(i.code,{className:`language-math math-inline`,children:`\\vec{L}`}),` can be found in
`,(0,n.jsx)(i.a,{href:`http://dx.doi.org/10.1007/978-3-642-54322-7`,children:`Appendix B of Hertel`}),`. To find the eigenbasis, we first need to
identify the commutation relationships between the components of
`,(0,n.jsx)(i.code,{className:`language-math math-inline`,children:`\\hat{\\vec{L}}`}),`. We can calculate them following commutation
relationships:`]}),`
`,(0,n.jsx)(i.pre,{children:(0,n.jsx)(i.code,{className:`language-math math-display`,children:`= [yp_z - zp_y, zp_x - xp_z]\\\\
=[yp_z, zp_x]-[yp_z,xp_z]- [zp_y, zp_x] + [zp_y,xp_z]\\\\
=[yp_z, zp_x] + [zp_y,xp_z]\\\\
=[yp_z, z]p_x +x[zp_y,p_z]\\\\
=-i\\hbar yp_x +i\\hbar xp_y\\\\
= i\\hbar L_z`})}),`
`,(0,n.jsx)(i.p,{children:`This relationship holds for all the other components too
and we have in general:`}),`
`,(0,n.jsx)(i.pre,{children:(0,n.jsx)(i.code,{className:`language-math math-display`,children:`= i\\hbar \\epsilon_{ijk}L_k`})}),`
`,(0,n.jsx)(i.p,{children:`The orbital angular momentum is therefore part of the
large family of angular momentum operators, which also comprises spin
etc. In particular the different components are not independent, and
therefore we cannot form a basis out the three components. A suitable
choice is actually to use the following combinations:`}),`
`,(0,n.jsx)(i.pre,{children:(0,n.jsx)(i.code,{className:`language-math math-display`,children:`\\hat{\\vec{L}}^2\\left|l,m_l\\right\\rangle = \\hbar^2 l (l+1)\\left|l,m_l\\right\\rangle\\\\
\\hat{L}_z\\left|l,m_l\\right\\rangle = \\hbar m_l \\left|l,m_l\\right\\rangle`})}),`
`,(0,n.jsxs)(i.ul,{children:[`
`,(0,n.jsxs)(i.li,{children:[`
`,(0,n.jsxs)(i.p,{children:[(0,n.jsx)(i.code,{className:`language-math math-inline`,children:`l`}),` is a non-negative integer and it is called the `,(0,n.jsx)(i.strong,{children:`orbital angular
momentum quantum number`}),`.`]}),`
`]}),`
`,(0,n.jsxs)(i.li,{children:[`
`,(0,n.jsxs)(i.p,{children:[(0,n.jsx)(i.code,{className:`language-math math-inline`,children:`m_l`}),` takes values `,(0,n.jsx)(i.code,{className:`language-math math-inline`,children:`-l, -l+1, ..., l-1, l`}),` and it is sometimes
called the `,(0,n.jsx)(i.strong,{children:`projection of the angular momentum`}),`.`]}),`
`]}),`
`]}),`
`,(0,n.jsx)(i.h2,{children:`Eigenfunction of the angular momentum operators`}),`
`,(0,n.jsx)(i.p,{children:`Having identified the relevant operators it would be nice to obtain a
space representation of them. This works especially nicely in spherical
coordinates. There, we get`}),`
`,(0,n.jsx)(i.pre,{children:(0,n.jsx)(i.code,{className:`language-math math-display`,children:`\\hat{L}_z= - i \\hbar \\partial_{\\phi}\\\\
\\hat{\\vec{L}}^2 = - \\hbar^2 \\left[\\frac{1}{\\sin(\\theta)}\\partial_{\\theta} \\left( \\sin(\\theta) \\partial_\\theta\\right) + \\frac{1}{\\sin^2(\\theta)} \\partial_{\\phi\\phi} \\right].`})}),`
`,(0,n.jsx)(i.p,{children:`The corresponding wave functions are`}),`
`,(0,n.jsx)(i.pre,{children:(0,n.jsx)(i.code,{className:`language-math math-display`,children:`\\left\\langle\\theta, \\phi | l,m_l\\right\\rangle = Y_{lm}(\\theta,\\phi).`})}),`
`,(0,n.jsxs)(i.p,{children:[`Where `,(0,n.jsx)(i.code,{className:`language-math math-inline`,children:`Y_{lm}(\\theta, \\phi)`}),` are the `,(0,n.jsx)(i.strong,{children:`spherical harmonics`}),`.`]}),`
`,(0,n.jsx)(i.h1,{children:`The radial wave equation`}),`
`,(0,n.jsx)(i.p,{children:`Given that we now know that the angular momentum is conserved for the
hydrogen atom, we can actually rewrite the Hamltonian in terms of the angular momentum as
we find:`}),`
`,(0,n.jsx)(i.pre,{children:(0,n.jsx)(i.code,{className:`language-math math-display`,children:`\\hat{H}_\\text{atom} = \\hat{H}_r + \\frac{\\hat{L}}{2\\mu r^2}+V(r) \\\\
\\hat{H}_r = -\\frac{\\hbar^2}{2\\mu}\\frac{1}{r^2}\\frac{\\partial}{\\partial r}\\left(r^2\\frac{\\partial}{\\partial r}\\right)`})}),`
`,(0,n.jsxs)(i.p,{children:[`We can now separate out the angular part and decompose
it over the eigenfunctions of `,(0,n.jsx)(i.code,{className:`language-math math-inline`,children:`\\hat{\\vec{L}}`}),`, such that we make the
ansatz `,(0,n.jsx)(i.sup,{children:(0,n.jsx)(i.a,{href:`#user-content-fn-2`,id:`user-content-fnref-2`,"data-footnote-ref":!0,"aria-describedby":`footnote-label`,children:`2`})}),`:`]}),`
`,(0,n.jsx)(i.pre,{children:(0,n.jsx)(i.code,{className:`language-math math-display`,children:`\\psi (r,\\theta,\\phi) = R(r) Y_{lm}(\\theta,\\phi)`})}),`
`,(0,n.jsx)(i.p,{children:`We can plug this separated ansatz in the Schrödinger equation. We
already solved the angular in the discussion of the angular momentum and
for the radial part we obtain:`}),`
`,(0,n.jsx)(i.pre,{children:(0,n.jsx)(i.code,{className:`language-math math-display`,children:`-\\frac{\\hbar^2}{2\\mu}\\frac{1}{r}\\frac{d^2(rR(r))}{dr^2} - \\frac{Ze^2}{4\\pi\\epsilon_0 r} R(r) + \\frac{\\hbar^2}{2\\mu}\\frac{l(l+1)}{r^2}R(r) = ER(r)`})}),`
`,(0,n.jsxs)(i.p,{children:[`Substituting `,(0,n.jsx)(i.code,{className:`language-math math-inline`,children:`R(r)=u(r)/r`}),` leads to`]}),`
`,(0,n.jsx)(i.pre,{children:(0,n.jsx)(i.code,{className:`language-math math-display`,children:`-\\frac{\\hbar^2}{2\\mu}\\frac{d^2}{dr^2}u(r) +\\underbrace{ \\left( -\\frac{Ze^2}{4\\pi\\epsilon_0 r} + \\frac{\\hbar^2}{2\\mu} \\frac{l(l+1)}{r^2} \\right)}_{V_{\\text{eff}}} u(r) = E \\, u(r),`})}),`
`,(0,n.jsxs)(i.p,{children:[`which is known as the "radial wave equation". It is a
very general result for `,(0,n.jsx)(i.em,{children:`any`}),` central potential. It can also be used to
describe unbound states (`,(0,n.jsx)(i.code,{className:`language-math math-inline`,children:`E>0`}),`) that occur during scattering.`]}),`
`,(0,n.jsx)(i.p,{children:`In the next lecture we will look into the energy scales of the hydrogen atom and then start
coupling different levels.`}),`
`,(0,n.jsxs)(i.section,{"data-footnotes":!0,className:`footnotes`,children:[(0,n.jsx)(i.h2,{className:`sr-only`,id:`footnote-label`,children:`Footnotes`}),`
`,(0,n.jsxs)(i.ol,{children:[`
`,(0,n.jsxs)(i.li,{id:`user-content-fn-1`,children:[`
`,(0,n.jsxs)(i.p,{children:[`The commutator between `,(0,n.jsx)(i.code,{className:`language-math math-inline`,children:`\\hat{X}`}),` and `,(0,n.jsx)(i.code,{className:`language-math math-inline`,children:`\\hat{P}`}),` is still as for `,(0,n.jsx)(i.code,{className:`language-math math-inline`,children:`x`}),`
and `,(0,n.jsx)(i.code,{className:`language-math math-inline`,children:`p`}),`. `,(0,n.jsx)(i.a,{href:`#user-content-fnref-1`,"data-footnote-backref":``,"aria-label":`Back to reference 1`,className:`data-footnote-backref`,children:`↩`})]}),`
`]}),`
`,(0,n.jsxs)(i.li,{id:`user-content-fn-2`,children:[`
`,(0,n.jsxs)(i.p,{children:[`Only if the system is in a well-defined angular momentum state, we
can write it down like this. `,(0,n.jsx)(i.a,{href:`#user-content-fnref-2`,"data-footnote-backref":``,"aria-label":`Back to reference 2`,className:`data-footnote-backref`,children:`↩`})]}),`
`]}),`
`]}),`
`]})]})}function o(e={}){let{wrapper:t}=e.components||{};return t?(0,n.jsx)(t,{...e,children:(0,n.jsx)(a,{...e})}):a(e)}export{o as default,i as frontmatter};