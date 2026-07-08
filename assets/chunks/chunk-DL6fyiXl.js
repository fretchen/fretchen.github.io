import{kn as e}from"./chunk-DCq2tb4F.js";import{t}from"./chunk-CDRG_CNZ2.js";var n=e(),r=`/assets/static/lecture12_pic1.CPWPeAgN.png`,i=`/assets/static/lecture12_pic2.DJGP6iuN.png`,a=`/assets/static/lecture12_pic3.CvV7F9xO.png`,o=`/assets/static/lecture12_pic4.D5vp2IUA.png`,s=`/assets/static/lecture12_pic5.BIdt-gG3.png`,c={author:[`fretchen`,`Selim Jochim`,`Matthias Weidemüller`],order:12,title:`Lecture 12- Entanglement`};function l(e){let c={a:`a`,code:`code`,em:`em`,h1:`h1`,h2:`h2`,li:`li`,ol:`ol`,p:`p`,pre:`pre`,section:`section`,sup:`sup`,ul:`ul`,...e.components};return(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)(c.p,{children:`We will discuss the creation of entangled photons and how they can be
used for the test of Bell's inequalities.`}),`
`,(0,n.jsx)(c.p,{children:`We have previously discussed how complicated gain media allow for the
amplification light. Here we will discuss how it is
used to create entangled photons and then dive into the fundamental test
of the Bell inequalities.`}),`
`,(0,n.jsx)(c.h1,{children:`Parametric down-conversion`}),`
`,(0,n.jsx)(t,{id:`fig-downcon`,href:r,caption:`The process of spontaneous parametric down-conversion (SPDC) and photon detection setup`}),`
`,(0,n.jsxs)(c.p,{children:[`Fig. `,(0,n.jsx)(c.a,{href:`#fig-downcon`,children:`1`}),` shows the
schematic setup of an experiment where pairs of entangled photons are
created by a two-photon source. Two polarizers can be used to probe the
polarization of the photons.`]}),`
`,(0,n.jsx)(c.h2,{children:`Three-wave mixing`}),`
`,(0,n.jsx)(c.p,{children:`The crystal in the medium is a non-linear crystal, which means that we
can write the polarization is not just linear, but higher order terms
will play a role. We will consider for starters that there are actually
two pump waves in the same direction, which allows us to write:`}),`
`,(0,n.jsx)(c.pre,{children:(0,n.jsx)(c.code,{className:`language-math math-display`,children:`P_{NL}(z) = 2\\epsilon_0 \\chi^{(2)}\\mathcal{E}_1(z)\\mathcal{E}_2(z)e^{i(k_1+k_2)z}`})}),`
`,(0,n.jsx)(c.p,{children:`This non-linear polarizability leads to the following
equations of motion [@grynberg]:`}),`
`,(0,n.jsx)(c.pre,{children:(0,n.jsx)(c.code,{className:`language-math math-display`,children:`\\frac{d\\mathcal{E}_3}{dz}e^{ik_3 z} = \\frac{i\\omega_3}{2\\epsilon_0n_3c}P_{NL}(z) \\\\
 \\frac{d\\mathcal{E}_3}{dz}= \\frac{i\\omega_3}{n_3c}\\chi^{(2)}\\mathcal{E}_1(z)\\mathcal{E}_2(z)e^{i(k_1+k_2-k_3)z} \\\\,`})}),`
`,(0,n.jsxs)(c.p,{children:[`where `,(0,n.jsx)(c.code,{className:`language-math math-inline`,children:`\\omega_3 = \\omega_1 + \\omega_2`}),`. We can now
additionally assume that:`]}),`
`,(0,n.jsxs)(c.ul,{children:[`
`,(0,n.jsxs)(c.li,{children:[`
`,(0,n.jsx)(c.p,{children:`The effect of the medium does not change the strong pump to much.`}),`
`]}),`
`,(0,n.jsxs)(c.li,{children:[`
`,(0,n.jsx)(c.p,{children:`The amplified field is zero initially.`}),`
`]}),`
`,(0,n.jsxs)(c.li,{children:[`
`,(0,n.jsxs)(c.p,{children:[`The oscillating phase factor `,(0,n.jsx)(c.code,{className:`language-math math-inline`,children:`(k_1+k_2-k_3)z`}),` can be ignored, i.e.
where we have:`]}),`
`]}),`
`]}),`
`,(0,n.jsx)(c.pre,{children:(0,n.jsx)(c.code,{className:`language-math math-display`,children:`    \\vec{k}_3 = \\vec{k}_1 + \\vec{k}_2



`})}),`
`,(0,n.jsx)(c.p,{children:`We can then simplify to:`}),`
`,(0,n.jsx)(c.pre,{children:(0,n.jsx)(c.code,{className:`language-math math-display`,children:` \\frac{d\\mathcal{E}_3}{dz}=\\frac{i\\omega_3 \\chi^{(2)}}{n_3c}\\mathcal{E}_1\\mathcal{E}_2`})}),`
`,(0,n.jsx)(c.p,{children:`So the amplitude of the mixed field increases in a
linear fashion in the non-linear medium. However, the typical amplitude
for production is below 1% for commonly used crystals.`}),`
`,(0,n.jsx)(c.h1,{children:`Polarization entangled photons`}),`
`,(0,n.jsx)(c.p,{children:`We will try to observe correlations between the photons. Two optical
fibers are collecting the pairs of photons and transmit them to the
single photon detectors. Finite collection and detection efficiency
causes only one of the two photons to be detected in most cases.
Therefore, a coincidence circuit registers events in which two photons
arrive within 30 ns. As the rate of detected individual photons is about
50 kHz, we assume that photons arriving during such a small time window
were created in the same event.`}),`
`,(0,n.jsx)(c.h2,{children:`Polarization analysis`}),`
`,(0,n.jsxs)(c.p,{children:[`To study the quantum nature of the correlations, we will employ
polarizers and later dive into Bell's inequalities as well as
entanglement in general. The interested reader will have a great time
reading through the complement 5.C of `,(0,n.jsx)(c.a,{href:`https://www.cambridge.org/core/books/introduction-to-quantum-optics/F45DCE785DC8226D4156EC15CAD5FA9A`,children:`Grynberg`}),`.`]}),`
`,(0,n.jsxs)(c.p,{children:[`The first emitted photon is analyzed by a rotatable polarizers
`,(0,n.jsx)(c.code,{className:`language-math math-inline`,children:`\\hat{A}(\\theta)`}),`, which has two detection paths `,(0,n.jsx)(c.code,{className:`language-math math-inline`,children:`\\pm1`}),`. The other
polarizer will be called `,(0,n.jsx)(c.code,{className:`language-math math-inline`,children:`\\hat{B}(\\theta)`}),` the only difference is that
he only acts on photon 2. Basically, we are following the `,(0,n.jsx)(c.em,{children:`Alice`}),` and
`,(0,n.jsx)(c.em,{children:`Bob`}),` notation here.`]}),`
`,(0,n.jsxs)(c.p,{children:[`We can express it then in our basis states of vertical polarization
`,(0,n.jsx)(c.code,{className:`language-math math-inline`,children:`\\left|V\\right\\rangle`}),` and horizontal polarization
`,(0,n.jsx)(c.code,{className:`language-math math-inline`,children:`\\left|H\\right\\rangle`}),`. The polarizer aligned with `,(0,n.jsx)(c.code,{className:`language-math math-inline`,children:`H`}),` has
eigenvalues:`]}),`
`,(0,n.jsx)(c.pre,{children:(0,n.jsx)(c.code,{className:`language-math math-display`,children:`\\hat{A} \\left|H\\right\\rangle= +\\left|H\\right\\rangle\\\\
\\hat{A} \\left|V\\right\\rangle= -\\left|V\\right\\rangle`})}),`
`,(0,n.jsxs)(c.p,{children:[`To analyse the polarization of each photon in detail we can also rotate
the polarizer by an angle of `,(0,n.jsx)(c.code,{className:`language-math math-inline`,children:`\\theta`}),`. In this case the transmitted
eigenstates are:`]}),`
`,(0,n.jsx)(c.pre,{children:(0,n.jsx)(c.code,{className:`language-math math-display`,children:`\\left|\\theta\\right\\rangle_{+} = \\cos(\\theta)\\left|H\\right\\rangle +\\sin(\\theta)\\left|V\\right\\rangle\\\\
\\left|\\theta\\right\\rangle_{-} = -\\sin(\\theta)\\left|H\\right\\rangle +\\cos(\\theta)\\left|V\\right\\rangle`})}),`
`,(0,n.jsxs)(c.p,{children:[`Taking as input states
`,(0,n.jsx)(c.code,{className:`language-math math-inline`,children:`\\left|H\\right\\rangle`}),`, we simply find Malus law:`]}),`
`,(0,n.jsx)(c.pre,{children:(0,n.jsx)(c.code,{className:`language-math math-display`,children:`P_+(\\theta) = \\cos(\\theta)^2\\\\
P_-(\\theta) = \\sin(\\theta)^2\\\\`})}),`
`,(0,n.jsx)(c.p,{children:`In the rotated basis we can express the polarization
operator as:`}),`
`,(0,n.jsx)(c.pre,{children:(0,n.jsx)(c.code,{className:`language-math math-display`,children:`\\hat{A}(\\theta) = \\left(\\begin{array}{cc}
\\cos(2\\theta)& \\sin(2\\theta)\\\\
\\sin(2\\theta)& -\\cos(2\\theta)
\\end{array}\\right)`})}),`
`,(0,n.jsxs)(c.p,{children:[`We can now employ the two polarizers to investigate the
two emitted photons as shown in Fig. `,(0,n.jsx)(c.a,{href:`#fig-polar-anal`,children:`2`}),`.`]}),`
`,(0,n.jsx)(t,{id:`fig-polar-anal`,href:i,caption:`Polarization analysis of correlated photons`}),`
`,(0,n.jsxs)(c.p,{children:[`The possible outcome of our experiments are the four states
`,(0,n.jsx)(c.code,{className:`language-math math-inline`,children:`\\{HH, HV, VH, VV\\}`}),` and hence we could decompose our full wavefunction
as:`]}),`
`,(0,n.jsx)(c.pre,{children:(0,n.jsx)(c.code,{className:`language-math math-display`,children:`\\left|\\psi\\right\\rangle = c_0 \\left|HH\\right\\rangle+ c_1 \\left|HV\\right\\rangle + c_2 \\left|VH\\right\\rangle + c_3\\left|VV\\right\\rangle`})}),`
`,(0,n.jsx)(c.p,{children:`Using the two polarizers we can now start to investigate
the prefactors of the full wavefunction. Let us first look into the
results of a polarizer that is not rotated. We find:`}),`
`,(0,n.jsx)(c.pre,{children:(0,n.jsx)(c.code,{className:`language-math math-display`,children:`\\left\\langle\\psi\\right|\\hat{A}\\left|\\psi\\right\\rangle=|c_0|^2 + |c_1|^2 - |c_2|^2-|c_3|^2`})}),`
`,(0,n.jsx)(c.p,{children:`For Bobs polarizer in the same position we would find:`}),`
`,(0,n.jsx)(c.pre,{children:(0,n.jsx)(c.code,{className:`language-math math-display`,children:`\\left\\langle\\psi\\right|\\hat{B}\\left|\\psi\\right\\rangle=|c_0|^2+ |c_2|^2 - |c_1|^2 -|c_3|^2`})}),`
`,(0,n.jsx)(c.h2,{children:`An equivalent 2 qubit circuit`}),`
`,(0,n.jsx)(c.p,{children:`The optics setup handles two independent photons, with two outcomes
each. So we can also see the presented setup as a two qubit system. A
circuit diagram would mostly look the following way.`}),`
`,(0,n.jsx)(t,{id:`fig-two-qubit`,href:a,caption:`Realizing the two-photon experiment within a quantum circuit`}),`
`,(0,n.jsxs)(c.p,{children:[`The two photons originate from an unknown source, which is here modelled
by photons propagating through some unitary matrix `,(0,n.jsx)(c.code,{className:`language-math math-inline`,children:`\\hat{U}`}),`. The
measurement is performed in the last step, projecting the qubit on its
up or down state. The rotation around the x axis `,(0,n.jsx)(c.code,{className:`language-math math-inline`,children:`\\hat{R}_x`}),` transforms
a qubit state into a superposition. In strong analogy to the
polarization`]}),`
`,(0,n.jsx)(c.h2,{children:`A naive guess`}),`
`,(0,n.jsx)(c.p,{children:`We know that we have two photons in the system. Both can have some
polarization and clearly they are propagation in different directions.
So it does not seems to much of a stretch to guess that the total
wavefunction is the product of two superposition states:`}),`
`,(0,n.jsx)(c.pre,{children:(0,n.jsx)(c.code,{className:`language-math math-display`,children:`
\\left|\\psi\\right\\rangle_{p} = (c_{H,1}\\left|H\\right\\rangle +c_{V,1} \\left|V\\right\\rangle)\\otimes(c_{H,2}\\left|H\\right\\rangle+c_{V,2}\\left|V\\right\\rangle) \\\\
= (c_{H,1}c_{H,2}\\left|HH\\right\\rangle + c_{V,1}c_{V,2}\\left|VV\\right\\rangle + c_{V,1}c_{H,2}\\left|VH\\right\\rangle + c_{H,1}c_{V,2}\\left|HV\\right\\rangle)`})}),`
`,(0,n.jsx)(c.h2,{children:`The experimental observation of entanglement`}),`
`,(0,n.jsxs)(c.ul,{children:[`
`,(0,n.jsxs)(c.li,{children:[`
`,(0,n.jsxs)(c.p,{children:[`We find a lot of counts if both polarizers are set vertical or
horizontal. So the state has a `,(0,n.jsx)(c.code,{className:`language-math math-inline`,children:`VV`}),` and a `,(0,n.jsx)(c.code,{className:`language-math math-inline`,children:`HH`}),` component, which
tells us that `,(0,n.jsx)(c.code,{className:`language-math math-inline`,children:`c_0`}),` and `,(0,n.jsx)(c.code,{className:`language-math math-inline`,children:`c_{3}`}),` are non-zero. The equal rate of
measuring further tells us that they are roughly similiar in
amplitude, so we can write for simplicity `,(0,n.jsx)(c.code,{className:`language-math math-inline`,children:`|c_0| = |c_3|`})]}),`
`]}),`
`,(0,n.jsxs)(c.li,{children:[`
`,(0,n.jsxs)(c.p,{children:[`We find zero correlation if the polarizers are opposite. So the
mixed terms are zero `,(0,n.jsx)(c.code,{className:`language-math math-inline`,children:`c_1 = c_2 = 0`})]}),`
`]}),`
`]}),`
`,(0,n.jsx)(c.p,{children:`In summary we can expect the Bell state can to be written as:`}),`
`,(0,n.jsx)(c.pre,{children:(0,n.jsx)(c.code,{className:`language-math math-display`,children:`\\left|\\psi_B\\right\\rangle = \\frac{\\left|HH\\right\\rangle +\\left|VV\\right\\rangle}{\\sqrt{2}}`})}),`
`,(0,n.jsx)(c.p,{children:`This is quite clearly incompatible with our naive guess, which means that we have an entangled state.`}),`
`,(0,n.jsx)(c.h1,{children:`Optional: Quantifying entanglement`}),`
`,(0,n.jsx)(c.p,{children:`We will study the properties of the entangled states later in more
detail. However, we will take a short moment to cite two ways of
quanitfying the entanglement through the density operator:`}),`
`,(0,n.jsx)(c.pre,{children:(0,n.jsx)(c.code,{className:`language-math math-display`,children:`\\hat{\\rho} = \\sum_i \\eta_i \\left|i\\right\\rangle \\left\\langle i\\right|`})}),`
`,(0,n.jsx)(c.p,{children:`The reduced density operator, which shows mixed states if there is
entanglement:`}),`
`,(0,n.jsx)(c.pre,{children:(0,n.jsx)(c.code,{className:`language-math math-display`,children:`    \\hat{\\rho}_1 = \\mathrm{tr}_{2}(\\hat{\\rho})`})}),`
`,(0,n.jsxs)(c.p,{children:[`In this case, `,(0,n.jsx)(c.code,{className:`language-math math-inline`,children:`\\hat{\\rho}`}),` is the density operator
of a pure state and `,(0,n.jsx)(c.code,{className:`language-math math-inline`,children:`\\textrm{tr}_2`}),` is the trace over the Hilbert
space of particle 2.`]}),`
`,(0,n.jsx)(c.p,{children:`The von Neumann entropy, which measures the remaining uncertainty
within a quantum state:`}),`
`,(0,n.jsx)(c.pre,{children:(0,n.jsx)(c.code,{className:`language-math math-display`,children:`    S=-\\mathrm{tr}(\\hat{\\rho}\\ln\\hat{\\rho})\\\\
     = - \\sum_i \\eta_i \\ln \\eta_i = \\sum_i \\eta_i \\ln \\frac{1}{\\eta_i}`})}),`
`,(0,n.jsx)(c.p,{children:`For the Bell states of we find then:`}),`
`,(0,n.jsx)(c.pre,{children:(0,n.jsx)(c.code,{className:`language-math math-display`,children:`\\hat{\\rho_B}_1 = \\frac{1}{2} \\left( \\left|H\\right\\rangle\\left\\langle H\\right| + \\left|V\\right\\rangle\\left\\langle V\\right| \\right)`})}),`
`,(0,n.jsxs)(c.p,{children:[`Its corresponding entropy is `,(0,n.jsx)(c.code,{className:`language-math math-inline`,children:`S=\\ln 2`}),`, the entropy of a
pure state is `,(0,n.jsx)(c.code,{className:`language-math math-inline`,children:`S=0`}),`.`]}),`
`,(0,n.jsx)(c.h1,{children:`Back to the correlation between distant photons`}),`
`,(0,n.jsx)(c.p,{children:`In the last sections we performed measurements on joined detection
probabilities between two independent polarizers. Quite importantly we
saw that:`}),`
`,(0,n.jsxs)(c.ul,{children:[`
`,(0,n.jsxs)(c.li,{children:[`
`,(0,n.jsxs)(c.p,{children:[`Each photon is in a superposition of
`,(0,n.jsx)(c.code,{className:`language-math math-inline`,children:`\\left|H\\right\\rangle`}),` and
`,(0,n.jsx)(c.code,{className:`language-math math-inline`,children:`\\left|V\\right\\rangle`}),`.`]}),`
`]}),`
`,(0,n.jsxs)(c.li,{children:[`
`,(0,n.jsx)(c.p,{children:`Both photons are always detected in the same polarization state.`}),`
`]}),`
`,(0,n.jsxs)(c.li,{children:[`
`,(0,n.jsxs)(c.p,{children:[`From Fig. `,(0,n.jsx)(c.a,{href:`#fig-polar-anal`,children:`2`}),` it
seems as if 1 was a bit closer to the source than 2 `,(0,n.jsx)(c.sup,{children:(0,n.jsx)(c.a,{href:`#user-content-fn-1`,id:`user-content-fnref-1`,"data-footnote-ref":!0,"aria-describedby":`footnote-label`,children:`1`})}),`. So 1 is
detected a bit earlier and projected onto one of the two states.`]}),`
`]}),`
`,(0,n.jsxs)(c.li,{children:[`
`,(0,n.jsx)(c.p,{children:`Yet, 2 seems to instantaneously on which polarization 1 was
projected and choses the same one.`}),`
`]}),`
`]}),`
`,(0,n.jsx)(c.p,{children:`For our set-up the distances are small, but the same observations and
arguments hold also for very large distances between the detectors.
Einstein, Podolski and Rosen understood this long distance correlation
and decided that something was funky about quantum mechanics
[@Einstein_1935].`}),`
`,(0,n.jsxs)(c.p,{children:[`Therefore, the idea of an additional hidden shared parameter can be
introduced to explain the correlations between distant objects. We will
simply assume that the two photons have well-defined polarization with
angle `,(0,n.jsx)(c.code,{className:`language-math math-inline`,children:`\\lambda`}),` from the starting point, yet this polarization varies
randomly from pair to pair between 0 and `,(0,n.jsx)(c.code,{className:`language-math math-inline`,children:`2\\pi`}),`. Hence we have uniform
probability distribution `,(0,n.jsx)(c.code,{className:`language-math math-inline`,children:`\\rho(\\lambda) = \\frac{1}{2\\pi}`}),`. The
measurement of the polarizers can then simply be modelled through`]}),`
`,(0,n.jsx)(c.pre,{children:(0,n.jsx)(c.code,{className:`language-math math-display`,children:`A_{hv}(\\lambda, \\theta) =\\text{sign}\\left(\\cos2 (\\theta-\\lambda)\\right)`})}),`
`,(0,n.jsxs)(c.p,{children:[`This model reproduces nicely all the tests that we ran
previously. Namely, maximum detection for HH and VV as well as zero
correlation for `,(0,n.jsx)(c.code,{className:`language-math math-inline`,children:`HV`}),`. They can be nicely compared through the
correlation coefficient `,(0,n.jsx)(c.code,{className:`language-math math-inline`,children:`E(\\theta_1,\\theta_2)`}),`. The particularly
perturbing case is that this simple model for hidden parameters works
even perfectly well in the case of `,(0,n.jsx)(c.code,{className:`language-math math-inline`,children:`45^\\circ`}),` angles. So is there any
measurable difference between our observations and the hidden variable
models ?`]}),`
`,(0,n.jsx)(t,{id:`fig-corr`,href:o,caption:`Correlation coefficient`}),`
`,(0,n.jsx)(c.h1,{children:`Bell's theorem`}),`
`,(0,n.jsxs)(c.p,{children:[`Bell posed the previous discussion on a more general and quite simple
footing `,(0,n.jsx)(c.a,{href:`http://dx.doi.org/10.1103/physicsphysiquefizika.1.195`,children:`Bell 1964`}),` and later extended by `,(0,n.jsx)(c.a,{href:`http://dx.doi.org/10.1103/physrevlett.23.880`,children:`Clauser, Horner, Shimony, Holt`}),`. For the hidden parameter we need just a standard
density distribution with:`]}),`
`,(0,n.jsx)(c.pre,{children:(0,n.jsx)(c.code,{className:`language-math math-display`,children:`\\rho(\\lambda)\\geq 0\\\\
\\int d\\lambda \\rho(\\lambda) = 1`})}),`
`,(0,n.jsxs)(c.p,{children:[`We additionally should describe the polarizer by some function that
takes the value `,(0,n.jsx)(c.code,{className:`language-math math-inline`,children:`\\pm 1`}),` depending on the angle of the polarizer and the
hidden variable:`]}),`
`,(0,n.jsx)(c.pre,{children:(0,n.jsx)(c.code,{className:`language-math math-display`,children:`|A(\\lambda, \\theta_1) |= |A(\\lambda, \\theta_2) | =1`})}),`
`,(0,n.jsxs)(c.p,{children:[`In the experiment we now have two polarizers `,(0,n.jsx)(c.code,{className:`language-math math-inline`,children:`A`}),` for
Alice and `,(0,n.jsx)(c.code,{className:`language-math math-inline`,children:`B`}),` for Bob, which we will allow to be in some position
`,(0,n.jsx)(c.code,{className:`language-math math-inline`,children:`\\theta`}),` as visualized in Fig. `,(0,n.jsx)(c.a,{href:`#fig-bell`,children:`5`}),`.`]}),`
`,(0,n.jsx)(t,{id:`fig-bell`,href:s,caption:`A Bell experiment`}),`
`,(0,n.jsx)(c.p,{children:`We will now calculate the the expectation value for joint detection:`}),`
`,(0,n.jsx)(c.pre,{children:(0,n.jsx)(c.code,{className:`language-math math-display`,children:`E(\\theta_1, \\theta_2)=\\overline{A(\\theta_1)B(\\theta_2)}-\\overline{A(\\theta_1)}~\\overline{B(\\theta_2)}`})}),`
`,(0,n.jsx)(c.p,{children:`We can simplify further for equal probability of having
H or V polarization, which leads too:`}),`
`,(0,n.jsx)(c.pre,{children:(0,n.jsx)(c.code,{className:`language-math math-display`,children:`E(\\theta_1, \\theta_2)=\\overline{A(\\theta_1)B(\\theta_2)}\\\\
 =\\int d\\lambda  A(\\lambda, \\theta_1)B(\\lambda, \\theta_2)`})}),`
`,(0,n.jsx)(c.p,{children:`Bells inequalities are then studying the correlations
between photons in four different configuations:`}),`
`,(0,n.jsx)(c.pre,{children:(0,n.jsx)(c.code,{className:`language-math math-display`,children:`s(\\lambda, \\theta_1, \\theta_1', \\theta_2, \\theta_2')= A(\\lambda, \\theta_1)B(\\lambda, \\theta_2)-A(\\lambda, \\theta_1)B(\\lambda, \\theta_2') +A(\\lambda, \\theta_1')B(\\lambda, \\theta_2)+A(\\lambda, \\theta_1')B(\\lambda, \\theta_2')\\\\
= A(\\lambda, \\theta_1)(B(\\lambda, \\theta_2)-B(\\lambda, \\theta_2'))+A(\\lambda, \\theta_1')(B(\\lambda, \\theta_2)+B(\\lambda, \\theta_2'))\\\\
= \\pm 2`})}),`
`,(0,n.jsx)(c.p,{children:`We actually have no access to the hidden parameter, so
we are looking for its average value:`}),`
`,(0,n.jsx)(c.pre,{children:(0,n.jsx)(c.code,{className:`language-math math-display`,children:`S = \\int d\\lambda \\rho(\\lambda) s(\\lambda, \\theta_1, \\theta_1', \\theta_2, \\theta_2')\\\\
-2\\leq S\\leq 2`})}),`
`,(0,n.jsx)(c.p,{children:`And this value can now be measured experimentally as we
can identify:`}),`
`,(0,n.jsx)(c.pre,{children:(0,n.jsx)(c.code,{className:`language-math math-display`,children:`S = E(\\theta_1, \\theta_2)-E(\\theta_1, \\theta_2')+E(\\theta_1', \\theta_2)+E(\\theta_1', \\theta_2')`})}),`
`,(0,n.jsx)(c.p,{children:`This is known as the Bell--Clauser--Horn--Shimony--Holt
(CHSH) inequalities.`}),`
`,(0,n.jsx)(c.h2,{children:`The inconsistency between hidden parameters and quantum mechanics`}),`
`,(0,n.jsx)(c.p,{children:`We can now go again through the predictions of quantum mechanics and
test if there is a region of interest in which we should observe a
violation of the CHSH inequalities. Actually there is an important
configuration at which we should break them rather violantly namely for:`}),`
`,(0,n.jsx)(c.pre,{children:(0,n.jsx)(c.code,{className:`language-math math-display`,children:`|\\theta_1-\\theta_2| =\\frac{\\pi}{8}(22.5^\\circ)\\\\
|\\theta_1'-\\theta_2| =\\frac{\\pi}{8}(22.5^\\circ)\\\\
|\\theta_1'-\\theta_2'| =\\frac{\\pi}{8}(22.5^\\circ)\\\\
|\\theta_1-\\theta_2'| =\\frac{3\\pi}{8}(67.5^\\circ)\\\\`})}),`
`,(0,n.jsxs)(c.p,{children:[`Here, we expect to have `,(0,n.jsx)(c.code,{className:`language-math math-inline`,children:`S= 2\\sqrt{2}`}),`. So to test Bells
inequalities we have to measure the joint probabilities in rather
unusual angles. This also explains why quantum mechanics and local
hidden variables seem so similiar in this kind of experiments, the
biggest differences are hard to see accidentally.`]}),`
`,(0,n.jsx)(c.h2,{children:`The experimental test`}),`
`,(0,n.jsx)(c.p,{children:`We can now study the correlations for the following configuration.`}),`
`,(0,n.jsx)(c.pre,{children:(0,n.jsx)(c.code,{className:`language-math math-display`,children:`\\theta_1 = 0 \\text{ and }\\theta_1' = \\frac{\\pi}{4}\\\\
\\theta_2 = \\frac{\\pi}{8} \\text{ and }\\theta_2' = \\frac{3\\pi}{8}\\\\`})}),`
`,(0,n.jsx)(t,{id:`fig-measure`,href:s,caption:`Correlation measurements`}),`
`,(0,n.jsxs)(c.p,{children:[`In the figure above we present correlation measurement between the two photons measured with the
setup shown in the second figure. One of the rotatable polarizers stays at an angle
`,(0,n.jsx)(c.code,{className:`language-math math-inline`,children:`\\gamma \\in \\{ 0^\\circ, 45^\\circ, 90^\\circ, 135^\\circ \\}`}),` while the
other polarizer is rotated counter-clockwise in small steps between
`,(0,n.jsx)(c.code,{className:`language-math math-inline`,children:`0^{\\circ}`}),` and `,(0,n.jsx)(c.code,{className:`language-math math-inline`,children:`360^{\\circ}`}),`. Experimentally we observe quite frequently values above 2. However,
please be aware that there are a lot of loopholes in our test. The most
obvious ones are:`]}),`
`,(0,n.jsxs)(c.ol,{children:[`
`,(0,n.jsxs)(c.li,{children:[`
`,(0,n.jsx)(c.p,{children:`Position of the polarizers is not random.`}),`
`]}),`
`,(0,n.jsxs)(c.li,{children:[`
`,(0,n.jsx)(c.p,{children:`The detectors are not well separated.`}),`
`]}),`
`]}),`
`,(0,n.jsxs)(c.p,{children:[`Other loopholes exist, but all realistically known loopholes have been
closed over the course of the last three decades with examples from `,(0,n.jsx)(c.a,{href:`http://dx.doi.org/10.1103/physrevlett.115.250401`,children:`Gustina et al.`}),`, `,(0,n.jsx)(c.a,{href:`http://dx.doi.org/10.1103/physrevlett.115.250402`,children:`Shalm et al.`}),` and `,(0,n.jsx)(c.a,{href:`http://dx.doi.org/10.1038/nature15759`,children:`Hensen et al.`}),`.`]}),`
`,(0,n.jsxs)(c.section,{"data-footnotes":!0,className:`footnotes`,children:[(0,n.jsx)(c.h2,{className:`sr-only`,id:`footnote-label`,children:`Footnotes`}),`
`,(0,n.jsxs)(c.ol,{children:[`
`,(0,n.jsxs)(c.li,{id:`user-content-fn-1`,children:[`
`,(0,n.jsxs)(c.p,{children:[`The exact order does not matter, but they are most certainly not
at exactly the same distance from the source `,(0,n.jsx)(c.a,{href:`#user-content-fnref-1`,"data-footnote-backref":``,"aria-label":`Back to reference 1`,className:`data-footnote-backref`,children:`↩`})]}),`
`]}),`
`]}),`
`]})]})}function u(e={}){let{wrapper:t}=e.components||{};return t?(0,n.jsx)(t,{...e,children:(0,n.jsx)(l,{...e})}):l(e)}export{u as default,c as frontmatter};