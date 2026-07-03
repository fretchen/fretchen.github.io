import{On as e}from"./chunk-DpnvOa7p.js";import{t}from"./chunk-CZAWoKTR2.js";var n=e(),r=`/assets/static/lecture10_pic1.Cedo5095.png`,i={author:[`fretchen`],order:10,title:`Lecture 10 - Propagation of light in dielectric media`};function a(e){let i={a:`a`,code:`code`,h2:`h2`,h3:`h3`,li:`li`,ol:`ol`,p:`p`,pre:`pre`,strong:`strong`,ul:`ul`,...e.components};return(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)(i.p,{children:`In this lecture we will study the propagation of light through a
dielectric medium like atomic gases. We will see that it is
characterized by the susceptibility and discuss the case of two-level
atoms. This sets the stage for the laser.`}),`
`,(0,n.jsx)(i.p,{children:`Until now we focused on the properties of atoms and how can control them
through external fields. In this lecture, we will focus much more on the
properties of the light passing through a medium.`}),`
`,(0,n.jsx)(i.h2,{children:`Introduction`}),`
`,(0,n.jsxs)(i.p,{children:[`We would like to study the propagation of a electric field through an
ensemble of atoms as visualized in Fig.
`,(0,n.jsx)(i.a,{href:`#fig-dielectric`,children:`1`}),`. We assume a
mono-chromatic plane wave to come in, such that we can write down the
electric field as:`]}),`
`,(0,n.jsx)(i.pre,{children:(0,n.jsx)(i.code,{className:`language-math math-display`,children:`\\vec{E}_{in}= E_0 \\vec{\\epsilon}e^{i kz -i\\omega_L t}`})}),`
`,(0,n.jsx)(i.p,{children:`This incoming field will polarize the gas of dipoles.`}),`
`,(0,n.jsx)(t,{id:`fig-dielectric`,href:r,caption:`Propagation of a light field through a dielectric medium`}),`
`,(0,n.jsx)(i.p,{children:`For the propagation we will do the following assumptions:`}),`
`,(0,n.jsxs)(i.ul,{children:[`
`,(0,n.jsx)(i.li,{children:`The atoms are independent.`}),`
`,(0,n.jsx)(i.li,{children:`We can describe them as small dipoles.`}),`
`,(0,n.jsx)(i.li,{children:`We can describe the light in the semi-classical approximation.`}),`
`]}),`
`,(0,n.jsx)(i.p,{children:`We have already employed this picture in in the slightly abstract
formulation in Lecture 4, where we studied the evolution of the atoms in
electric fields and in Lecture 6
concerning the transition rules in hydrogen. This allows us to calculate
the expectation value of the dipole operator through:`}),`
`,(0,n.jsx)(i.pre,{children:(0,n.jsx)(i.code,{className:`language-math math-display`,children:`\\langle \\vec{D}\\rangle = \\left\\langle\\psi\\right|\\vec{D}\\left|\\psi\\right\\rangle`})}),`
`,(0,n.jsx)(i.p,{children:`As already discussed in Lecture 6 we can then write it down as:`}),`
`,(0,n.jsx)(i.pre,{children:(0,n.jsx)(i.code,{className:`language-math math-display`,children:`\\langle \\vec{D}\\rangle = E_0 \\vec{\\alpha}`})}),`
`,(0,n.jsxs)(i.p,{children:[`We call `,(0,n.jsx)(i.code,{className:`language-math math-inline`,children:`\\alpha`}),` the `,(0,n.jsx)(i.strong,{children:`polarizability`}),`. For a large gas
with a constant density of dipoles `,(0,n.jsx)(i.code,{className:`language-math math-inline`,children:`n`}),`, we obtain a macroscopic
polarization of:`]}),`
`,(0,n.jsx)(i.pre,{children:(0,n.jsx)(i.code,{className:`language-math math-display`,children:`\\vec{P} = n \\langle \\vec{D}\\rangle\\\\
= n \\vec{\\alpha} E_0`})}),`
`,(0,n.jsx)(i.p,{children:`This leads us then to identify the susceptibility of the
dielectric medium:`}),`
`,(0,n.jsx)(i.pre,{children:(0,n.jsx)(i.code,{className:`language-math math-display`,children:`
\\vec{P} = \\epsilon_0 \\chi \\vec{E}\\\\
\\chi = \\frac{n \\alpha}{\\epsilon_0}`})}),`
`,(0,n.jsx)(i.p,{children:`To notes to this relation:`}),`
`,(0,n.jsxs)(i.ol,{children:[`
`,(0,n.jsx)(i.li,{children:`The linear relationship between polarization and electric field is
only valid for weak electric fields. For stronger fields, higher
order terms become important. They are the fundamental ingredient of
non-linear optics. In general, we can write:`}),`
`]}),`
`,(0,n.jsx)(i.pre,{children:(0,n.jsx)(i.code,{className:`language-math math-display`,children:`    P_i = \\epsilon_0 \\sum_{j}\\chi_{ij}^{1}E_j+\\epsilon_0 \\sum_{jk}\\chi_{ijk}^{2}E_jE_k + ...



`})}),`
`,(0,n.jsxs)(i.ol,{start:`2`,children:[`
`,(0,n.jsxs)(i.li,{children:[`Given that `,(0,n.jsx)(i.code,{className:`language-math math-inline`,children:`\\chi`}),` and `,(0,n.jsx)(i.code,{className:`language-math math-inline`,children:`\\alpha`}),` are proportional to
`,(0,n.jsx)(i.code,{className:`language-math math-inline`,children:`\\langle D \\rangle`}),`, they can be complex. We will see that real and
imaginary part have very different interpretations.`]}),`
`]}),`
`,(0,n.jsx)(i.h2,{children:`Propagation of light`}),`
`,(0,n.jsx)(i.p,{children:`At this stage we would like to understand the propagation of an electric
field through such a polarized medium. The general Maxwell equation
actually reads:`}),`
`,(0,n.jsx)(i.pre,{children:(0,n.jsx)(i.code,{className:`language-math math-display`,children:`
\\nabla^2 \\vec{E}-\\frac{1}{c^2}\\frac{\\partial^2 \\vec{E}}{\\partial t^2}= \\frac{1}{\\epsilon_0 c^2}\\frac{\\partial^2 \\vec{P}}{\\partial t^2}`})}),`
`,(0,n.jsxs)(i.p,{children:[`This equation can be massively simplified by only
looking at a slowly-evolving envelope `,(0,n.jsx)(i.code,{className:`language-math math-inline`,children:`\\mathcal{E}(r,t)`}),` and
`,(0,n.jsx)(i.code,{className:`language-math math-inline`,children:`\\mathcal{P}(r,t)`}),`, which are defined through:`]}),`
`,(0,n.jsx)(i.pre,{children:(0,n.jsx)(i.code,{className:`language-math math-display`,children:`\\vec{E} = \\mathcal{E} e^{ikz-i \\omega_L t}\\\\
\\vec{P} = \\mathcal{P} e^{ikz-i \\omega_L t}\\\\`})}),`
`,(0,n.jsxs)(i.p,{children:[`As shown in more detail in `,(0,n.jsx)(i.a,{href:`http://lukin.physics.harvard.edu/wp-uploads/Papers/285b_notes_2005-1.Lily.pdf`,children:`Chapter 4 of Lukin`}),`, the Maxwell equation reduces then to:`]}),`
`,(0,n.jsx)(i.pre,{children:(0,n.jsx)(i.code,{className:`language-math math-display`,children:`\\frac{\\partial}{\\partial z}\\mathcal{E}+\\frac{1}{c}\\frac{\\partial}{\\partial t}\\mathcal{E} = \\frac{ik}{2\\epsilon_0}\\mathcal{P}`})}),`
`,(0,n.jsx)(i.p,{children:`This equation becomes especially transparent, if we investigate it for
very long times, such that we can perform a Fourier transformation and
obtain:`}),`
`,(0,n.jsx)(i.pre,{children:(0,n.jsx)(i.code,{className:`language-math math-display`,children:`\\frac{\\partial}{\\partial z}\\mathcal{E}= i\\frac{\\omega}{c}\\mathcal{E} +\\frac{ik}{2\\epsilon_0}\\mathcal{P}`})}),`
`,(0,n.jsx)(i.p,{children:`Finally, we can use the definition of the susceptibility to write:`}),`
`,(0,n.jsx)(i.pre,{children:(0,n.jsx)(i.code,{className:`language-math math-display`,children:`\\frac{\\partial}{\\partial z}\\mathcal{E}= i\\left(\\frac{\\omega}{c} +\\frac{k}{2} \\chi(\\omega)\\right) \\mathcal{E}\\\\
\\mathcal{E}(\\omega, z) =E_0 e^{i\\left(\\frac{\\omega}{c} +\\frac{k}{2}\\chi(\\omega)\\right)z}`})}),`
`,(0,n.jsx)(i.h3,{children:`Absorption and refraction`}),`
`,(0,n.jsxs)(i.p,{children:[`The meaning of the susceptibility becomes especially clear for a
continuous wave, where `,(0,n.jsx)(i.code,{className:`language-math math-inline`,children:`\\omega\\rightarrow 0`}),` and we obtain:`]}),`
`,(0,n.jsx)(i.pre,{children:(0,n.jsx)(i.code,{className:`language-math math-display`,children:`\\mathcal{E}(\\omega\\rightarrow 0, z) =E_0 e^{i\\frac{k\\chi(0)}{2} z}`})}),`
`,(0,n.jsx)(i.p,{children:`We can then see that:`}),`
`,(0,n.jsxs)(i.ul,{children:[`
`,(0,n.jsxs)(i.li,{children:[`
`,(0,n.jsxs)(i.p,{children:[`The imaginary part of the susceptibility leads to absorption on a
scale `,(0,n.jsx)(i.code,{className:`language-math math-inline`,children:`l^{-1} = \\frac{k}{2}\\text{Im}(\\chi(0))`})]}),`
`]}),`
`,(0,n.jsxs)(i.li,{children:[`
`,(0,n.jsxs)(i.p,{children:[`The real part describes a phase shift. The evolution of the electric
field can be seen as propagating with a wavevector
`,(0,n.jsx)(i.code,{className:`language-math math-inline`,children:`k \\rightarrow k +\\frac{k}{2}\\text{Re}(\\chi(0))`}),`, so the dielectric
medium has a refractive index `,(0,n.jsx)(i.code,{className:`language-math math-inline`,children:`n = 1 + \\frac{\\text{Re}(\\chi(0))}{2}`})]}),`
`]}),`
`]}),`
`,(0,n.jsx)(i.h3,{children:`Dispersion`}),`
`,(0,n.jsx)(i.p,{children:`If the electric field has a certain frequency distribution, we might
have to perform the proper integral to obtain the time evolution, i.e.:`}),`
`,(0,n.jsx)(i.pre,{children:(0,n.jsx)(i.code,{className:`language-math math-display`,children:`\\mathcal{E}(t, z) =\\int d\\omega e^{-i\\omega t}\\mathcal{E}(\\omega,0) e^{i\\left(\\frac{\\omega}{c} +\\frac{k}{2}\\chi(\\omega)\\right)z}`})}),`
`,(0,n.jsx)(i.p,{children:`To solve the problem we can develop the susceptibility:`}),`
`,(0,n.jsx)(i.pre,{children:(0,n.jsx)(i.code,{className:`language-math math-display`,children:`\\chi(\\omega) = \\chi(0)+\\frac{d\\chi}{d\\omega}\\omega`})}),`
`,(0,n.jsx)(i.p,{children:`And we obtain:`}),`
`,(0,n.jsx)(i.pre,{children:(0,n.jsx)(i.code,{className:`language-math math-display`,children:`\\mathcal{E}(t, z) =e^{izk\\chi(0)/2}
\\mathcal{E}(t-z/v_g, 0)\\\\
v_g = \\frac{c}{1+\\frac{\\omega_L}{2}\\frac{d\\chi}{d\\omega}}`})}),`
`,(0,n.jsx)(i.p,{children:`So the group velocity is controlled by the derivative of the
susceptibility !`}),`
`,(0,n.jsx)(i.h2,{children:`Two level system`}),`
`,(0,n.jsxs)(i.p,{children:[`After this rather general discussion, we will now employ it to
understand the action of two-level systems on the travelling beam. So we
will now focus on the influence of the atoms on the field in comparision
with the previous discussions. Further, we will have to take into
account the finite lifetime of the excited states in a phenomenological
manner. For a two level system with excited state
`,(0,n.jsx)(i.code,{className:`language-math math-inline`,children:`\\left|e\\right\\rangle`}),` and groundstate
`,(0,n.jsx)(i.code,{className:`language-math math-inline`,children:`\\left|g\\right\\rangle`}),`, we can directly write down the
wavefunction as:`]}),`
`,(0,n.jsx)(i.pre,{children:(0,n.jsx)(i.code,{className:`language-math math-display`,children:`\\left|\\psi\\right\\rangle = \\gamma_g\\left|g\\right\\rangle+ \\gamma_e\\left|e\\right\\rangle`})}),`
`,(0,n.jsx)(i.p,{children:`In this basis, the dipole element reads:`}),`
`,(0,n.jsx)(i.pre,{children:(0,n.jsx)(i.code,{className:`language-math math-display`,children:`\\langle D\\rangle = \\left\\langle e\\right|D\\left|g\\right\\rangle \\gamma_e^*\\gamma_g\\\\
= d \\sigma_{eg}`})}),`
`,(0,n.jsx)(i.p,{children:`In the second line we introduced the notations:`}),`
`,(0,n.jsxs)(i.ul,{children:[`
`,(0,n.jsxs)(i.li,{children:[`
`,(0,n.jsx)(i.p,{children:(0,n.jsx)(i.code,{className:`language-math math-inline`,children:`d = \\left\\langle e\\right|D\\left|g\\right\\rangle`})}),`
`]}),`
`,(0,n.jsxs)(i.li,{children:[`
`,(0,n.jsxs)(i.p,{children:[`The product `,(0,n.jsx)(i.code,{className:`language-math math-inline`,children:`\\gamma_e^*\\gamma_g`}),` can identified with the
off-diagonal component of the density operator
`,(0,n.jsx)(i.code,{className:`language-math math-inline`,children:`\\sigma=\\left|\\psi\\right\\rangle\\left\\langle\\psi\\right|`}),`.
We will often call it `,(0,n.jsx)(i.strong,{children:`coherence`}),`.`]}),`
`]}),`
`]}),`
`,(0,n.jsx)(i.p,{children:`The Hamiltonian of this model reads then in the rotating
wave-approximation:`}),`
`,(0,n.jsx)(i.pre,{children:(0,n.jsx)(i.code,{className:`language-math math-display`,children:`\\hat{H} = 0\\left|g\\right\\rangle\\left\\langle g\\right|+\\hbar\\delta \\left|e\\right\\rangle\\left\\langle e\\right| + \\hbar\\Omega\\left[\\left|e\\right\\rangle\\left\\langle g\\right|+\\left|g\\right\\rangle\\left\\langle e\\right|\\right]\\\\
\\Omega = d E/\\hbar`})}),`
`,(0,n.jsx)(i.p,{children:`This is exactly the model that we discussed in the
lectures 3 and 4 [@Jendrzejewskib; @Jendrzejewskia]. We then found that
the time evolution might be described via:`}),`
`,(0,n.jsx)(i.pre,{children:(0,n.jsx)(i.code,{className:`language-math math-display`,children:`i\\dot{\\gamma}_g(t) = \\Omega \\gamma_e\\\\
i\\dot{\\gamma}_e(t) = \\delta \\gamma_e +\\Omega \\gamma_g\\\\`})}),`
`,(0,n.jsx)(i.p,{children:`We can combine them to the components of the density
operator, which then read:`}),`
`,(0,n.jsx)(i.pre,{children:(0,n.jsx)(i.code,{className:`language-math math-display`,children:`\\sigma_{ij} = c_{i}^*c_j`})}),`
`,(0,n.jsx)(i.p,{children:`From these coefficients, we can now obtain the evolution
of the populations:`}),`
`,(0,n.jsx)(i.pre,{children:(0,n.jsx)(i.code,{className:`language-math math-display`,children:`\\dot{N}_g = \\dot{\\sigma}_{gg} = \\dot{\\gamma}_{g}^*\\gamma_g+ \\gamma_{g}^*\\dot{\\gamma}_g\\\\
= i\\Omega(\\sigma_{eg}-\\sigma_{ge})\\\\
\\dot{N}_e = -\\dot{N}_g`})}),`
`,(0,n.jsx)(i.p,{children:`So the total number of atoms stays automatically
conserved. As for the coherences we obtain:`}),`
`,(0,n.jsx)(i.pre,{children:(0,n.jsx)(i.code,{className:`language-math math-display`,children:`\\dot{\\sigma}_{eg} = \\dot{\\gamma}_{e}^*\\gamma_g+ \\gamma_{e}^*\\dot{\\gamma}_g\\\\
= i\\delta \\sigma_{eg}+i (N_g-N_e)\\Omega\\\\
\\dot{\\sigma}_{ge}= -i\\delta \\sigma_{ge}-i (N_g-N_e)\\Omega`})}),`
`,(0,n.jsx)(i.p,{children:`This density operator approach allows us to introduce spontaneous decay
in a very straight-forward fashion:`}),`
`,(0,n.jsxs)(i.ul,{children:[`
`,(0,n.jsxs)(i.li,{children:[`
`,(0,n.jsxs)(i.p,{children:[`The time evolution of the excited state gets an additional term
`,(0,n.jsx)(i.code,{className:`language-math math-inline`,children:`-\\Gamma N_e`}),`.`]}),`
`]}),`
`,(0,n.jsxs)(i.li,{children:[`
`,(0,n.jsxs)(i.p,{children:[`Atoms coming from the excited state relax to the ground state, so we
add a term `,(0,n.jsx)(i.code,{className:`language-math math-inline`,children:`\\Gamma N_e`}),`.`]}),`
`]}),`
`,(0,n.jsxs)(i.li,{children:[`
`,(0,n.jsxs)(i.p,{children:[`The coherence decays also through a term `,(0,n.jsx)(i.code,{className:`language-math math-inline`,children:`-\\Gamma_2 \\sigma_{ge}`}),`. We
will use here for simplicity the limit of `,(0,n.jsx)(i.code,{className:`language-math math-inline`,children:`\\Gamma_2 = \\Gamma/2`})]}),`
`]}),`
`]}),`
`,(0,n.jsx)(i.p,{children:`So the full equations read now:`}),`
`,(0,n.jsx)(i.pre,{children:(0,n.jsx)(i.code,{className:`language-math math-display`,children:`\\dot{N}_g = i\\Omega(\\sigma_{eg}-\\sigma_{ge})+\\Gamma N_e\\\\
\\dot{\\sigma}_{ge}= -i\\delta \\sigma_{ge}-i (N_g-N_e)\\Omega-\\Gamma_2\\sigma_{ge}`})}),`
`,(0,n.jsxs)(i.p,{children:[`At this stage we can find the steady-state solutions by setting
`,(0,n.jsx)(i.code,{className:`language-math math-inline`,children:`\\dot{N}_g = \\dot{\\sigma}_{ge} = 0`}),`. This leads too:`]}),`
`,(0,n.jsx)(i.pre,{children:(0,n.jsx)(i.code,{className:`language-math math-display`,children:`
N_e = \\frac{1}{2}\\frac{\\Omega^2 \\frac{\\Gamma_2}{\\Gamma}}{(\\omega_0-\\omega_L)^2+\\Gamma_2^2+\\Omega^2\\frac{\\Gamma_2}{\\Gamma}}`})}),`
`,(0,n.jsx)(i.pre,{children:(0,n.jsx)(i.code,{className:`language-math math-display`,children:`
\\sigma_{ge} = i\\frac{\\Omega}{2}\\frac{\\Gamma_2-i(\\omega_L-\\omega_0)}{\\Gamma_2^2+(\\omega_0-\\omega_L)^2+\\Omega^2\\Gamma_2/\\Gamma}`})}),`
`,(0,n.jsx)(i.p,{children:`In the next lecture we will employ those results to
study the laser.`})]})}function o(e={}){let{wrapper:t}=e.components||{};return t?(0,n.jsx)(t,{...e,children:(0,n.jsx)(a,{...e})}):a(e)}export{o as default,i as frontmatter};