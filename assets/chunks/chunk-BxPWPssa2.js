import{kn as e}from"./chunk-DCq2tb4F.js";import{t}from"./chunk-CDRG_CNZ2.js";var n=e(),r=`/assets/static/lecture11_pic1.C-I6sWTX.png`,i=`/assets/static/lecture11_pic2.BLkYA1nX.png`,a=`/assets/static/lecture11_pic3.D47qJQkA.png`,o=`/assets/static/lecture11_pic4.V9rwAUkn.png`,s={author:[`fretchen`],order:11,title:`Lecture 11 - Laser fundamentals`};function c(e){let s={a:`a`,code:`code`,h2:`h2`,h3:`h3`,li:`li`,ol:`ol`,p:`p`,pre:`pre`,section:`section`,strong:`strong`,sup:`sup`,ul:`ul`,...e.components};return(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)(s.p,{children:`We will study some basic properties of the laser.`}),`
`,(0,n.jsxs)(s.p,{children:[`In the last lecture we studied the interaction of atoms
and light. Most importantly, we saw that electric field can be dephased
and absorped through the interaction with atomic gases. In this lecture,
we will see how this interaction can be employed to induce lasing and
then study some basic properties of the laser. In the laser would most
importantly find a situation in which the light coming out of the
dielectric medium is amplified as shown in Fig.
`,(0,n.jsx)(s.a,{href:`#fig-laser`,children:`1`}),`.`]}),`
`,(0,n.jsx)(t,{id:`fig-laser`,href:r,caption:`The Laser set-up`}),`
`,(0,n.jsxs)(s.p,{children:[`The crucial idea of the system is that it is possible to find a
configuration for the medium in which it has a certain gain for the
propagation of the electric field. So if the light comes into the gain
medium with amplitude `,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`I_A`}),` it exits with amplitude `,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`G^{(0)}I_A`}),`. The
output mirror and losses lower the intensity such that the intensity. We
can describe losses by the aborption rate `,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`A`}),`. The transmission of the
semi-transparent mirror is quantified by the transmission coefficient
`,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`T`}),`. Putting it all together, the intensity just before reentering the
medium reads then `,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`G^{(0)}I_A(1-T)(1-A)`}),`. Amplification will happen if
this intensity is higher than the initial one:`]}),`
`,(0,n.jsx)(s.pre,{children:(0,n.jsx)(s.code,{className:`language-math math-display`,children:`G^{(0)}>\\frac{1}{(1-T)(1-A)}`})}),`
`,(0,n.jsx)(s.p,{children:`We will see that such a configuration is not trivial at all on the
two-level system. Then we will discuss the appropiate configuration for
lasing and a few properties of the laser.`}),`
`,(0,n.jsx)(s.h2,{children:`The two level system`}),`
`,(0,n.jsx)(s.p,{children:`In the last lecture, we saw that the two-level system might be described
by the following rate equations:`}),`
`,(0,n.jsx)(s.pre,{children:(0,n.jsx)(s.code,{className:`language-math math-display`,children:`\\dot{N}_g = i\\Omega(\\sigma_{eg}-\\sigma_{ge})+\\Gamma N_e\\\\
\\dot{\\sigma}_{ge}= -i\\delta \\sigma_{ge}-i (N_g-N_e)\\Omega-\\frac{\\Gamma}{2}\\sigma_{ge}`})}),`
`,(0,n.jsx)(s.p,{children:`The definitions were:`}),`
`,(0,n.jsxs)(s.ul,{children:[`
`,(0,n.jsxs)(s.li,{children:[`
`,(0,n.jsxs)(s.p,{children:[(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`\\Omega`}),` is the strength of the Rabi coupling.`]}),`
`]}),`
`,(0,n.jsxs)(s.li,{children:[`
`,(0,n.jsxs)(s.p,{children:[(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`\\delta`}),` the detuning.`]}),`
`]}),`
`,(0,n.jsxs)(s.li,{children:[`
`,(0,n.jsxs)(s.p,{children:[(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`\\Gamma`}),` is the lifetime of the excited state.`]}),`
`]}),`
`,(0,n.jsxs)(s.li,{children:[`
`,(0,n.jsxs)(s.p,{children:[(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`N_g`}),` the groundstate population.`]}),`
`]}),`
`,(0,n.jsxs)(s.li,{children:[`
`,(0,n.jsxs)(s.p,{children:[`And `,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`\\sigma_{g,e}`}),` is the coherence
`,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`\\sigma_{g,e} = \\gamma_g^* \\gamma_e`}),`.`]}),`
`]}),`
`,(0,n.jsxs)(s.li,{children:[`
`,(0,n.jsxs)(s.p,{children:[(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`\\Gamma_2`}),` is the lifetime of the coherence. For the moment we will
work in the limit `,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`\\Gamma_2 = \\frac{\\Gamma}{2}`}),`. Let we will relax
this point a bit.`]}),`
`]}),`
`]}),`
`,(0,n.jsxs)(s.p,{children:[`At this stage we can find the steady-state solutions by setting
`,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`\\dot{N}_g = \\dot{\\sigma}_{ge} = 0`}),`. This leads too:`]}),`
`,(0,n.jsx)(s.pre,{children:(0,n.jsx)(s.code,{className:`language-math math-display`,children:`
N_e = \\frac{1}{2}\\frac{\\Omega^2}{2\\delta^2+\\Gamma^2/2+\\Omega^2}`})}),`
`,(0,n.jsx)(s.pre,{children:(0,n.jsx)(s.code,{className:`language-math math-display`,children:`
\\sigma_{ge} = i\\frac{\\Omega}{2}\\frac{\\Gamma-i2\\delta}{2\\delta^2+\\Gamma^2/2+\\Omega^2}`})}),`
`,(0,n.jsx)(s.p,{children:`We will now discuss these results in the two important regimes of very
weak and very strong coupling. The first one is important for probe
experiments, while the second one is typically the one, where we would
like to operate a laser.`}),`
`,(0,n.jsx)(s.h3,{children:`Linear response`}),`
`,(0,n.jsxs)(s.p,{children:[`For very small coupling strength we can neglect the `,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`\\Omega`}),` dependence
in the coherence and we obtain:`]}),`
`,(0,n.jsx)(s.pre,{children:(0,n.jsx)(s.code,{className:`language-math math-display`,children:`\\sigma_{ge} = \\frac{\\Omega}{2}\\frac{\\delta+i\\Gamma/2}{\\Gamma^2/4+\\delta^2}`})}),`
`,(0,n.jsxs)(s.p,{children:[`We can now plug this into the dipole element `,(0,n.jsx)(s.sup,{children:(0,n.jsx)(s.a,{href:`#user-content-fn-1`,id:`user-content-fnref-1`,"data-footnote-ref":!0,"aria-describedby":`footnote-label`,children:`1`})}),`:`]}),`
`,(0,n.jsx)(s.pre,{children:(0,n.jsx)(s.code,{className:`language-math math-display`,children:`D = d \\sigma_{eg}\\\\
D = \\frac{d^2}{2}\\frac{\\delta-i\\Gamma/2}{\\Gamma^2/4+\\delta^2}E`})}),`
`,(0,n.jsxs)(s.p,{children:[`In the second line, we used the relationship
`,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`\\Omega = dE`}),` from lecture 4 [@Jendrzejewskia]. We can then directly
read of the polarizability and hence the susceptibility, which was
defined through `,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`D = \\alpha E`}),`:`]}),`
`,(0,n.jsx)(s.pre,{children:(0,n.jsx)(s.code,{className:`language-math math-display`,children:`\\alpha =\\frac{d^2}{2}\\frac{\\delta-i\\Gamma/2}{\\Gamma^2/4+\\delta^2}`})}),`
`,(0,n.jsxs)(s.p,{children:[`On resonance `,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`\\delta=0`}),` we have:`]}),`
`,(0,n.jsx)(s.pre,{children:(0,n.jsx)(s.code,{className:`language-math math-display`,children:`\\alpha(0) =-i\\frac{d^2}{\\Gamma}\\\\
\\chi(0) = -i\\frac{n}{\\epsilon_0}\\frac{d^2}{\\Gamma}`})}),`
`,(0,n.jsx)(s.p,{children:`We obtain now rather directly that:`}),`
`,(0,n.jsxs)(s.ul,{children:[`
`,(0,n.jsxs)(s.li,{children:[`
`,(0,n.jsx)(s.p,{children:`Absorption is maximal on resonance.`}),`
`]}),`
`,(0,n.jsxs)(s.li,{children:[`
`,(0,n.jsx)(s.p,{children:`There is no dephasing on resonance.`}),`
`]}),`
`,(0,n.jsxs)(s.li,{children:[`
`,(0,n.jsx)(s.p,{children:`For large detunings the absorption can be increasingly neglected and
the media becomes refractive as it only keeps an optical index.`}),`
`]}),`
`]}),`
`,(0,n.jsxs)(s.p,{children:[`We can then also look for maximum dephasing and find the it happens
close to the resonance. A summary can be found in Fig.
`,(0,n.jsx)(s.a,{href:`#fig-susc`,children:`2`}),`.`]}),`
`,(0,n.jsx)(t,{id:`fig-susc`,href:i,caption:`Susceptibility of the two level system`}),`
`,(0,n.jsx)(s.h3,{children:`Saturation`}),`
`,(0,n.jsx)(s.p,{children:`The population and coherence in the two-level system will saturate as a
substantial amount of atoms is excited. To simplify the discussion let
us rewrite the eq. the populations and coherence of the two-level system on resonance:`}),`
`,(0,n.jsx)(s.pre,{children:(0,n.jsx)(s.code,{className:`language-math math-display`,children:`N_e = \\frac{1}{2}\\frac{\\Omega^2}{\\Gamma^2/2+\\Omega^2}\\\\
\\sigma_{ge} = i\\frac{\\Omega}{2}\\frac{\\Gamma}{\\Gamma^2/2+\\Omega^2}`})}),`
`,(0,n.jsxs)(s.p,{children:[`We can see that the excited fraction is limited to `,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`1/2`}),`
of the atoms. So at some point the system cannot react anymore to the
additional coupling strength. This is also the reason for the decay of
the coherence at very large `,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`\\Omega`}),`, which is basically telling us that
the medium becomes transparent. This kind of observations motivates for
practical purposes to introduce the saturation intensity
`,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`I_{sat} \\propto \\frac{\\Gamma^2}{2}`}),`, which allows us to rewrite the
previous to equations as:`]}),`
`,(0,n.jsx)(s.pre,{children:(0,n.jsx)(s.code,{className:`language-math math-display`,children:`N_e = \\frac{1}{2}\\frac{I/I_{sat}}{1+I/I_{sat}}`})}),`
`,(0,n.jsx)(s.p,{children:`Finally, this kind of expressions allows us also nicely to see the
direct connection between the dipole element and the number of excited
atoms:`}),`
`,(0,n.jsx)(s.pre,{children:(0,n.jsx)(s.code,{className:`language-math math-display`,children:`\\sigma_{ge} = i\\frac{N_e}{\\Omega}`})}),`
`,(0,n.jsx)(s.p,{children:`So we never obtain a situation, where the two-level
system amplifies light. Let us look into this situation once again from
a technical point of view to see if we can obtain situations of
amplificiation.`}),`
`,(0,n.jsx)(s.h2,{children:`Rate equations`}),`
`,(0,n.jsx)(s.p,{children:`To understand laser it is best to formulate the interaction of atoms and
light in terms of rate equations for the populations, assuming that the
coherences follow adiabatically. While strict derivations can become
very tedious, they can be written down in a phenomenological way rather
easily. So we will convince us here in some limiting cases of the
usefulness.`}),`
`,(0,n.jsx)(s.p,{children:`We now would like to use the previous discussions to set up the
necessary formalism for laser amplification, which is based on the idea
of rate equations. While these equations are of phenomenological nature,
we can convince ourselves of their soundness in a first step.`}),`
`,(0,n.jsx)(s.h3,{children:`The two-level system`}),`
`,(0,n.jsx)(s.p,{children:`In the last lecture we saw that we can write down the following Bloch
equations for the two-level system on resonance:`}),`
`,(0,n.jsx)(s.pre,{children:(0,n.jsx)(s.code,{className:`language-math math-display`,children:`\\dot{N}_g = -i\\Omega(\\sigma_{eg}-\\sigma_{ge})+\\Gamma N_e\\\\
\\dot{\\sigma}_{ge}= i (N_g-N_e)\\Omega-\\Gamma_2\\sigma_{ge}`})}),`
`,(0,n.jsxs)(s.p,{children:[`In a substantial amount of situations the coherences
reach the steady state much faster than the population. This can be due
to technical noise, collisions or other effects. In this case we can
assume `,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`\\dot{\\sigma}_{ge}=0`}),` and the solve for the populations:`]}),`
`,(0,n.jsx)(s.pre,{children:(0,n.jsx)(s.code,{className:`language-math math-display`,children:`\\sigma_{ge}= i \\frac{\\Omega}{\\Gamma_2} (N_g-N_e)\\\\
\\sigma_{eg}-\\sigma_{ge} = -2i \\frac{\\Omega}{\\Gamma_2} (N_g-N_e)`})}),`
`,(0,n.jsxs)(s.p,{children:[`We can see in this limit that the inversion of the sign
of the dipole element would come with `,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`N_g < N_e`}),` `,(0,n.jsx)(s.strong,{children:`in the
steady-state`}),`. We saw previously that we cannot achieve this limit in
the two-level system.`]}),`
`,(0,n.jsx)(s.p,{children:`Having eliminated adiabatically the coherences, we end up with the
following time evolution of the population:`}),`
`,(0,n.jsx)(s.pre,{children:(0,n.jsx)(s.code,{className:`language-math math-display`,children:`\\dot{N}_g = 2\\frac{\\Omega^2}{\\Gamma_2}(N_e-N_g)+\\Gamma N_e\\\\`})}),`
`,(0,n.jsx)(s.p,{children:`We can now identify the three terms as:`}),`
`,(0,n.jsxs)(s.ul,{children:[`
`,(0,n.jsxs)(s.li,{children:[`
`,(0,n.jsx)(s.p,{children:`Stimulated emission.`}),`
`]}),`
`,(0,n.jsxs)(s.li,{children:[`
`,(0,n.jsx)(s.p,{children:`Stimulated absorption.`}),`
`]}),`
`,(0,n.jsxs)(s.li,{children:[`
`,(0,n.jsx)(s.p,{children:`Spontaneous emission.`}),`
`]}),`
`]}),`
`,(0,n.jsxs)(s.p,{children:[`We will then focus on the rate equation for the populations and attempt
to find situations, where `,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`N_g < N_e`}),`.`]}),`
`,(0,n.jsx)(s.h3,{children:`Optional: Rate equations for light`}),`
`,(0,n.jsxs)(s.p,{children:[`To see, when light amplification will happen, we now need to connect the
rate equations to evolution of light within the medium. One heuristic
approach is guided by the Beer-Lambert law (Ch. 4.2.3 of `,(0,n.jsx)(s.a,{href:`https://doi.org/10.1007%2F978-3-642-54322-7`,children:`Hertel 2015`}),`
).`]}),`
`,(0,n.jsx)(s.pre,{children:(0,n.jsx)(s.code,{className:`language-math math-display`,children:`\\frac{dI}{dz}=- N_g\\sigma I`})}),`
`,(0,n.jsx)(s.p,{children:`We would like to translate this now more precisely into
a change of photon numbers through the relation:`}),`
`,(0,n.jsx)(s.pre,{children:(0,n.jsx)(s.code,{className:`language-math math-display`,children:`I = c \\hbar\\omega N_{ph}`})}),`
`,(0,n.jsxs)(s.p,{children:[`This allows us to rewrite for a propagation wave with
`,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`z = ct`}),`:`]}),`
`,(0,n.jsx)(s.pre,{children:(0,n.jsx)(s.code,{className:`language-math math-display`,children:`- \\frac{N_g\\sigma I}{\\hbar \\omega} = \\frac{d}{dt}N_{ph} = \\frac{dN_g}{dt} = -\\frac{dN_e}{dt}`})}),`
`,(0,n.jsx)(s.p,{children:`This allows us to define an absorption rate:`}),`
`,(0,n.jsx)(s.pre,{children:(0,n.jsx)(s.code,{className:`language-math math-display`,children:`R_{ab} =  \\frac{\\sigma I}{\\hbar \\omega}\\\\
= \\frac{1}{N_g}\\frac{dN_g}{dt}`})}),`
`,(0,n.jsxs)(s.p,{children:[`This process is just the description of `,(0,n.jsx)(s.strong,{children:`stimulated
absorption`}),`. Nothing was special about the discussion of the absorption
and we can actually also have exactly the inverse situation, where we
assume that all the atoms start out in the excited state and then lead
to an increased intensity:`]}),`
`,(0,n.jsx)(s.pre,{children:(0,n.jsx)(s.code,{className:`language-math math-display`,children:`\\frac{dI}{dz}= N_e\\sigma I`})}),`
`,(0,n.jsx)(s.p,{children:`Both processes are now computing and we obtain in
general:`}),`
`,(0,n.jsx)(s.pre,{children:(0,n.jsx)(s.code,{className:`language-math math-display`,children:`\\frac{dI}{dz}= (N_e-N_g)\\sigma I`})}),`
`,(0,n.jsx)(s.p,{children:`So if we have most atoms in the excited state and neglect the atoms in
the ground state we can actually have light amplification. This is idea
is underlying the laser. However, we have already seen for the two-level
system that this situation is not easily achieved and we will now
discuss it a bit further.`}),`
`,(0,n.jsx)(s.h2,{children:`Lasing condition in a four-level system`}),`
`,(0,n.jsx)(s.p,{children:`To obtain in the medium, it is necessary to have an excited state
population which is higher than the population of the ground state. This
is not possible in the two-level system and in practice realized mostly
in four-level systems.`}),`
`,(0,n.jsx)(t,{id:`fig-4level`,href:a,caption:`The 4 level system`}),`
`,(0,n.jsx)(s.p,{children:`The idea of such a system is the following:`}),`
`,(0,n.jsxs)(s.ul,{children:[`
`,(0,n.jsxs)(s.li,{children:[`
`,(0,n.jsxs)(s.p,{children:[`A strong pumping beam excites atoms into the state `,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`e`}),`.`]}),`
`]}),`
`,(0,n.jsxs)(s.li,{children:[`
`,(0,n.jsxs)(s.p,{children:[`From `,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`e`}),` they decay rapidely into the state b. This is the upper
state for the lasing transition `,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`b\\rightarrow a`}),`.`]}),`
`]}),`
`,(0,n.jsxs)(s.li,{children:[`
`,(0,n.jsxs)(s.p,{children:[`We obtain lasing on the transition `,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`b\\rightarrow a`}),`, which has a
decay rate of `,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`\\tau_B`})]}),`
`]}),`
`,(0,n.jsxs)(s.li,{children:[`
`,(0,n.jsxs)(s.p,{children:[`The lower state `,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`a`}),` is easily depopulated through the fast
relaxation `,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`a\\rightarrow g`}),`.`]}),`
`]}),`
`]}),`
`,(0,n.jsx)(s.p,{children:`We can now write down the rate equations for a weak laser, such that we
can only keep terms in first order:`}),`
`,(0,n.jsx)(s.pre,{children:(0,n.jsx)(s.code,{className:`language-math math-display`,children:`\\dot{N}_e = w(N_g-N_e)-N_e/\\tau_e\\\\
\\dot{N}_b = \\frac{N_e}{\\tau_e}-N_b/\\tau_b\\\\
\\dot{N}_a = \\frac{N_b}{\\tau_b}-N_a/\\tau_a\\\\
\\dot{N}_g = \\frac{N_a}{\\tau_a}-w(N_g-N_e)`})}),`
`,(0,n.jsxs)(s.p,{children:[`We can now find steady state solutions assuming that
`,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`\\tau_e, \\tau_a \\ll \\tau_b`}),`. Further we assume that the pumping to `,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`e`}),`
is not too strong, i.e. `,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`w \\tau_e\\ll1`}),`. We then obtain:`]}),`
`,(0,n.jsx)(s.pre,{children:(0,n.jsx)(s.code,{className:`language-math math-display`,children:`N_e \\simeq w\\tau_e N_g\\\\
N_b \\simeq w\\tau_b N_g\\\\
N_a \\simeq w\\tau_a N_g`})}),`
`,(0,n.jsx)(s.p,{children:`We then obtain the state populations:`}),`
`,(0,n.jsx)(s.pre,{children:(0,n.jsx)(s.code,{className:`language-math math-display`,children:`\\frac{N_b-N_a}{N_g + N_e + N_a + N_b}\\simeq \\frac{w\\tau_b}{1+w\\tau_b}`})}),`
`,(0,n.jsx)(s.p,{children:`Lasing is then obtained above the pumping threshold at which the gain
overcomes the losses.`}),`
`,(0,n.jsx)(s.h2,{children:`Steady-state operation of the laser`}),`
`,(0,n.jsx)(s.p,{children:`Assuming that the lasing condition is fullfilled, we can now investigate
its steady-state behavior. Quite importantly, we have to have an
electric field, which remains exactly constant after each round
trip.This implies to conditions:`}),`
`,(0,n.jsxs)(s.ul,{children:[`
`,(0,n.jsx)(s.li,{children:`The gain has to cancel the losses:`}),`
`]}),`
`,(0,n.jsx)(s.pre,{children:(0,n.jsx)(s.code,{className:`language-math math-display`,children:`    G = \\frac{1}{(1-T)(1-A)}



`})}),`
`,(0,n.jsxs)(s.ul,{children:[`
`,(0,n.jsxs)(s.li,{children:[`The phase after the round trip has to be a multiple of `,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`2\\pi`})]}),`
`]}),`
`,(0,n.jsxs)(s.p,{children:[`For a cavity of length `,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`L`}),`, the wavelength `,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`\\lambda_p`}),` has to be an
integer fraction:`]}),`
`,(0,n.jsx)(s.pre,{children:(0,n.jsx)(s.code,{className:`language-math math-display`,children:`L_{cav} = p\\lambda_p\\text{ with }p \\in  \\mathbb{N}\\\\
\\omega_p/2\\pi =p \\frac{c}{L}`})}),`
`,(0,n.jsxs)(s.p,{children:[`So the lasing will not happen at one single frequency,
but actually for any wavelength fulfilling this condition. The laser has
multiple `,(0,n.jsx)(s.strong,{children:`longitudinal modes`}),`. Some tricks allow to suppress this
multi-mode behavior, such that we obtain a very pure light source.`]}),`
`,(0,n.jsx)(t,{id:`fig-freq-laser`,href:o,caption:`Frequency distribution of the steady-state laser`}),`
`,(0,n.jsx)(s.h2,{children:`Mode-locked operation`}),`
`,(0,n.jsx)(s.p,{children:`We have seen in the last section that a laser might act in the multimode
regime. So let us write down for simplicity the total field, where we
assume that the relative phase between modes in uncorrelated and that
the amplitude is the same for all of them. We then have:`}),`
`,(0,n.jsx)(s.pre,{children:(0,n.jsx)(s.code,{className:`language-math math-display`,children:`E(t) = \\sum_{k=0}^{N-1}E_0 \\cos(\\omega_k t +\\phi_k)`})}),`
`,(0,n.jsx)(s.p,{children:`The frequency of each mode:`}),`
`,(0,n.jsx)(s.pre,{children:(0,n.jsx)(s.code,{className:`language-math math-display`,children:`\\omega_k = \\omega_0 + k \\Delta\\text{ with }\\Delta/2\\pi = \\frac{c}{L_{cav}}`})}),`
`,(0,n.jsx)(s.p,{children:`Summing the electric fields leads to an intensity:`}),`
`,(0,n.jsx)(s.pre,{children:(0,n.jsx)(s.code,{className:`language-math math-display`,children:`I(t)= \\frac{NE_0^2}{2}+E_0^2\\sum_{j_k}\\cos\\left[(\\omega_j-\\omega_k)t+\\phi_j-\\phi_k\\right]`})}),`
`,(0,n.jsxs)(s.p,{children:[`For uncorrelated fields this intensity is on average
`,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`\\overline{I} = \\frac{NE_0^2}{2}`}),` with temporal fluctuations in the
order of the amplitude itself `,(0,n.jsx)(s.sup,{children:(0,n.jsx)(s.a,{href:`#user-content-fn-2`,id:`user-content-fnref-2`,"data-footnote-ref":!0,"aria-describedby":`footnote-label`,children:`2`})}),` For correlated fields the equations
simplify a lot and we obtain:`]}),`
`,(0,n.jsx)(s.pre,{children:(0,n.jsx)(s.code,{className:`language-math math-display`,children:`I = \\frac{1}{2}\\left|\\sum_{k=0}^{N-1}E_0e^{-i\\omega_k t}\\right|^2\\\\
 = \\frac{E_0^2}{2}\\left|\\sum_{k=0}^{N-1}e^{i k\\Delta  t}\\right|^2\\\\
 = \\frac{E_0^2}{2}\\left|\\frac{\\sin(\\frac{N\\Delta t}{2})}{\\sin(\\frac{\\Delta t}{2})}\\right|^2`})}),`
`,(0,n.jsx)(s.p,{children:`The maximum intensity in this coherent sum is now`}),`
`,(0,n.jsx)(s.pre,{children:(0,n.jsx)(s.code,{className:`language-math math-display`,children:`I_{max} = N\\overline{I}`})}),`
`,(0,n.jsx)(s.p,{children:`We can then reach petawatt (!!) peak powers.`}),`
`,(0,n.jsx)(s.p,{children:`In the next lecture, we will study how the laser is actually used for the study of entanglement`}),`
`,(0,n.jsxs)(s.section,{"data-footnotes":!0,className:`footnotes`,children:[(0,n.jsx)(s.h2,{className:`sr-only`,id:`footnote-label`,children:`Footnotes`}),`
`,(0,n.jsxs)(s.ol,{children:[`
`,(0,n.jsxs)(s.li,{id:`user-content-fn-1`,children:[`
`,(0,n.jsxs)(s.p,{children:[`The sign change appears as we are now working with `,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`\\sigma_{eg}`}),`
instead of `,(0,n.jsx)(s.code,{className:`language-math math-inline`,children:`\\sigma_{ge}`}),` `,(0,n.jsx)(s.a,{href:`#user-content-fnref-1`,"data-footnote-backref":``,"aria-label":`Back to reference 1`,className:`data-footnote-backref`,children:`↩`})]}),`
`]}),`
`,(0,n.jsxs)(s.li,{id:`user-content-fn-2`,children:[`
`,(0,n.jsxs)(s.p,{children:[`We obtain actually a speckle pattern in time here. `,(0,n.jsx)(s.a,{href:`#user-content-fnref-2`,"data-footnote-backref":``,"aria-label":`Back to reference 2`,className:`data-footnote-backref`,children:`↩`})]}),`
`]}),`
`]}),`
`]})]})}function l(e={}){let{wrapper:t}=e.components||{};return t?(0,n.jsx)(t,{...e,children:(0,n.jsx)(c,{...e})}):c(e)}export{l as default,s as frontmatter};