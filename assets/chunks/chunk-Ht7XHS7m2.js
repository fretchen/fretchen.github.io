import{t as e}from"./chunk-BLhQqvoO.js";var t=e(),n={author:[`fretchen`],order:4,title:`Tutorial 4 - A few words about quantum computing with superconducting qubits`};function r(e){let n={a:`a`,code:`code`,em:`em`,h2:`h2`,h3:`h3`,li:`li`,ol:`ol`,p:`p`,pre:`pre`,strong:`strong`,ul:`ul`,...e.components};return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsxs)(n.p,{children:[`We have seen in the `,(0,t.jsx)(n.a,{href:`./2`,children:`last tutorial`}),` the
possibilities of quantum computation with trapped ions. However, a second major platform are superconducting qubits. They the platform of choice of commercial giants like `,(0,t.jsx)(n.a,{href:`https://quantumai.google/`,children:`google`}),`, `,(0,t.jsx)(n.a,{href:`https://www.ibm.com/quantum`,children:`IBM`}),` or `,(0,t.jsx)(n.a,{href:`https://www.rigetti.com/`,children:`Rigetti`}),`.
In this tutorial, we will identify the existence of qubits in superconducting circuits, the different gates and the read-out. We will finish by a comparison in the computing performance of trapped ions and
superconducting qubits.`]}),`
`,(0,t.jsx)(n.h2,{children:`The quantum LC-oscillator`}),`
`,(0,t.jsx)(n.p,{children:`As in the second tutorial, we have to find the appropiate harmonic oscillator, but this time in electric circuits. Then we can discuss
the need of the Josephson junction for the implementation of
superconducting qubits.`}),`
`,(0,t.jsxs)(n.p,{children:[`The fundamental ingredient for superconducting qubits are LC
oscillators, which are simply put a loop of wire which is not closed. To study
its quantum behavior we will closely follow the discussion in Sec. II of
`,(0,t.jsx)(n.a,{href:`https://arxiv.org/abs/1904.06560v2`,children:`"A Quantum Engineer's Guide to Superconducting Qubits"`}),`.`]}),`
`,(0,t.jsx)(n.p,{children:`In electrical engineering we first have to identify the conjugate
variables within the circuit. We will therefore follow the standard procedure of:`}),`
`,(0,t.jsxs)(n.ol,{children:[`
`,(0,t.jsxs)(n.li,{children:[`
`,(0,t.jsx)(n.p,{children:`Identifying the equations of motion.`}),`
`]}),`
`,(0,t.jsxs)(n.li,{children:[`
`,(0,t.jsx)(n.p,{children:`Identify the Lagrangien.`}),`
`]}),`
`,(0,t.jsxs)(n.li,{children:[`
`,(0,t.jsx)(n.p,{children:`Identify the conjugate variables.`}),`
`]}),`
`,(0,t.jsxs)(n.li,{children:[`
`,(0,t.jsx)(n.p,{children:`Write down the Hamiltonian.`}),`
`]}),`
`,(0,t.jsxs)(n.li,{children:[`
`,(0,t.jsx)(n.p,{children:`Quantize the Hamiltonian.`}),`
`]}),`
`]}),`
`,(0,t.jsxs)(n.p,{children:[`While it might be overly complicated for simple LC circuits it provides
a powerful framework for more complex systems (see `,(0,t.jsx)(n.a,{href:`https://doi.org/10.1103/physrevlett.108.240502`,children:`Nigg et al.`}),`
)`]}),`
`,(0,t.jsx)(n.h3,{children:`Lagrangien formulation`}),`
`,(0,t.jsxs)(n.p,{children:[`The wire is caracterized by an `,(0,t.jsx)(n.em,{children:`inductivity`}),`, which is counteracting the
change in current:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`\\begin{aligned}
V = L\\frac{dI}{dt}\\end{aligned}`})}),`
`,(0,t.jsxs)(n.p,{children:[`and a `,(0,t.jsx)(n.em,{children:`capacitance`}),`, which allows us
to measure the cost of putting charges on the ends of the wire:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`\\begin{aligned}
I = C\\frac{dV}{dt}\\end{aligned}`})}),`
`,(0,t.jsx)(n.p,{children:`To put it under a partical form for
quantization we typically express them through the flux, which is
defined as:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`\\begin{aligned}
\\Phi(t) = \\int_{-\\infty}^tV(t')dt'\\end{aligned}`})}),`
`,(0,t.jsx)(n.p,{children:`The electromagnetic
energy stored within the loop of wire is in general given by:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`\\begin{aligned}
E(t) &= \\int_{-\\infty}^t V(t')I(t')dt'\\end{aligned}`})}),`
`,(0,t.jsx)(n.p,{children:`We then obtain the
energies:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`\\begin{aligned}
E_{kin} = \\frac{1}{2}C\\dot{\\Phi}^2\\\\
E_{pot} = \\frac{1}{2L}\\Phi^2\\\\\\end{aligned}`})}),`
`,(0,t.jsx)(n.p,{children:`This now leads to the
Lagrangien:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`\\begin{aligned}
L &= \\frac{1}{2}C\\dot{\\Phi}^2-\\frac{1}{2L}\\Phi^2\\end{aligned}`})}),`
`,(0,t.jsx)(n.h3,{children:`Quantization`}),`
`,(0,t.jsx)(n.p,{children:`We can now identify the conjugate momentum the flux as:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`\\begin{aligned}
\\frac{\\partial L}{\\partial\\dot{\\Phi}} &= C \\dot{\\Phi}\\\\
&= Q\\end{aligned}`})}),`
`,(0,t.jsx)(n.p,{children:`So the charge is the conjugate variable to the flux
in the loop. They will be therefore the two fundamental variables of
quantum theory, very much like position and momentum are for massive
particles.`}),`
`,(0,t.jsx)(n.p,{children:`We can now write down the Hamiltonian as:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`\\begin{aligned}
H &= Q\\dot{\\Phi}- L\\\\
&= \\frac{Q^2}{2C}+\\frac{\\Phi^2}{2L}\\end{aligned}`})}),`
`,(0,t.jsx)(n.p,{children:`At this stage we can
quantize the system through the commutation relation:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`\\begin{aligned}
[\\hat{\\Phi},\\hat{Q}]&= i\\hbar\\\\
\\hat{H} &= \\frac{\\hat{Q}^2}{2C}+\\frac{\\hat{\\Phi}^2}{2L}\\end{aligned}`})}),`
`,(0,t.jsxs)(n.p,{children:[`So it is once again a harmonic oscillator with resonance frequency
`,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\omega_r = \\frac{1}{\\sqrt{LC}}`}),` and 'mass' `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`C`}),`. So the system reads:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`\\begin{aligned}
\\hat{H} &= \\hbar \\omega_r \\left(\\hat{a}^\\dagger a + \\frac{1}{2}\\right)\\end{aligned}`})}),`
`,(0,t.jsxs)(n.p,{children:[`While this is now a quantum system, it is manifestly not a qubit as the
transitions are equidistant in energy with `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\omega_r`}),`. The typical order
of magnitude is here 3-6GHz.`]}),`
`,(0,t.jsxs)(n.p,{children:[`To prepare for the introduction of superconducting elements, we typically rewrite the equations above in terms of dimensionless quantities. Namely the Cooper pair density `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`n = \\frac{Q}{2e}`}),` and the reduced flux `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\phi= 2\\pi \\Phi/\\Phi_0`}),` with `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\Phi_0 = \\frac{h}{2e}`}),`. These two quantities correspond directly to the density and the phase of the superconducting wavefunction that we will discuss in the next section. We then obtain the Hamiltonian `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\begin{aligned} \\hat{H} = 4E_C n^2 + \\frac{1}{2}E_L \\varphi^2\\end{aligned}`}),` So we quantify the influence of each lump element through their energy:`]}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsxs)(n.li,{children:[`
`,(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`E_C=\\frac{e^2}{2C}`}),` is the energy required to add a cooper pair.`]}),`
`]}),`
`,(0,t.jsxs)(n.li,{children:[`
`,(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`E_L=\\frac{(\\Phi_0/2\\pi)^2}{L}`}),` is the inductive energy`]}),`
`]}),`
`]}),`
`,(0,t.jsx)(n.h2,{children:`The Josephson junction`}),`
`,(0,t.jsxs)(n.p,{children:[`To resolve the degeneracy we need to make the oscillator anharmonic.
This is done through `,(0,t.jsx)(n.em,{children:`Josephson junctions`}),`, which are the backbone of
superconducting electronics (very much like the transistor or the diode
are classical electronics). To understand them roughly, we will fall
back on the `,(0,t.jsx)(n.a,{href:`http://www.feynmanlectures.caltech.edu/III_21.html`,children:`Feynman
picture`}),` of
Josephson dynamics.`]}),`
`,(0,t.jsx)(n.h3,{children:`A simplistic picture of superconductivity`}),`
`,(0,t.jsxs)(n.p,{children:[`We could spend several lectures to understand the physics of Josephson
junctions in all its gory details. A good overview might be found in the
following books `,(0,t.jsx)(n.a,{href:`https://www.crcpress.com/Superfluidity-and-Superconductivity/Tilley-Tilley/p/book/9780750300339`,children:`(D.R. Tilley, 1990`}),`; `,(0,t.jsx)(n.a,{href:`https://books.google.de/books?id=VpUk3NfwDIkC`,children:`Tinkham, 2004)`}),`. However, the basic idea is that the fermionic electrons form cooper
pairs at very low temperatures. These pairs are bosonic and can hence
condense into a macroscopic wavefunction: `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\begin{aligned}
\\psi(x,t) &= \\sqrt{n}e^{i\\varphi(x,t)}\\end{aligned}`}),` Now the system can
be understood through the following relations:`]}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsxs)(n.li,{children:[`
`,(0,t.jsxs)(n.p,{children:[`the density is given by `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`n= |\\psi(x,t)|^2`}),`.`]}),`
`]}),`
`,(0,t.jsxs)(n.li,{children:[`
`,(0,t.jsxs)(n.p,{children:[`The velocity is set by the gradient of the phase
`,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\vec{v}= \\frac{\\hbar}{2m_e}\\nabla \\varphi`}),`.`]}),`
`]}),`
`,(0,t.jsxs)(n.li,{children:[`
`,(0,t.jsxs)(n.p,{children:[`The voltage is set by the time evolution of the phase
`,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`V = \\frac{\\hbar}{2e} \\frac{\\partial \\varphi}{\\partial t}`}),`.`]}),`
`]}),`
`]}),`
`,(0,t.jsx)(n.h3,{children:`The Josephson relations`}),`
`,(0,t.jsx)(n.p,{children:`A Josephson junction describes now a system where two superconducting
regions are slightly separated by a normal metal such that only
tunneling is allowed between the two regions.`}),`
`,(0,t.jsx)(n.p,{children:`We can now write down the Schrödinger equation for this setup:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`\\begin{aligned}
i\\hbar \\partial_t \\psi_L &= \\frac{eV}{2}\\psi_L+J \\psi_R\\\\
i\\hbar \\partial_t \\psi_R &= -\\frac{eV}{2}\\psi_R+J \\psi_L\\end{aligned}`})}),`
`,(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`V`}),` is the voltage applied to the junction and `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`J`}),` is the tunneling
element. We now use the decomposition to write:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`\\begin{aligned}
\\dot{n}_L &= \\frac{2}{\\hbar}J\\sqrt{n_Rn_L}\\sin(\\delta )\\\\
\\dot{n}_R &= -\\frac{2}{\\hbar}J\\sqrt{n_Rn_L}\\sin(\\delta)\\\\
\\phi &=\\varphi_L-\\varphi_R\\end{aligned}`})}),`
`,(0,t.jsx)(n.p,{children:`We can now use it to write
down the current-phase relationship:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`\\begin{aligned}
I &= I_c\\sin(\\phi)\\\\
I_c &= \\frac{2}{\\hbar}Jn\\end{aligned}`})}),`
`,(0,t.jsx)(n.p,{children:`We can once again integrate the
equation of motion to obtain:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`\\begin{aligned}
\\hat{H} = 4E_Cn^2-E_J \\cos(\\phi)\\\\
E_C = \\frac{e^2}{2(C+C_J)}\\\\
E_J = \\frac{I_C\\Phi_0}{2\\pi}\\end{aligned}`})}),`
`,(0,t.jsx)(n.h2,{children:`Single qubit control`}),`
`,(0,t.jsx)(n.p,{children:`Superconducting qubits can be controlled either through inductive or
capacitive coupling. Inductive coupling is widely used for flux-qubits
like the rf-squid. However, here we focus on the transmon qubit, which
is typically capacitavely coupled`}),`
`,(0,t.jsx)(n.p,{children:`Going through the quantization procedure we discussed above, we can write
the circuit Hamiltonian as:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`\\begin{aligned}
\\hat{H} &= \\frac{\\tilde{Q}^2}{2C_\\Sigma}+\\frac{\\Phi^2}{2L}+\\frac{C_d}{C_\\Sigma}V_d(t)\\tilde{Q}\\end{aligned}`})}),`
`,(0,t.jsxs)(n.p,{children:[`The charge is defined for this system as
`,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\tilde{Q} = C_\\Sigma\\dot{\\Phi} - C_d V_d(t)`}),`. In the limit of weak
coupling `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`C_d V_d \\ll C_\\Sigma \\dot{\\Phi}`}),`, we have can quantize the
system as before and only need to understand the influence of the last
term.`]}),`
`,(0,t.jsx)(n.p,{children:`The second part of the Hamiltonian resembles strong the electric dipole
coupling we discussed in the last lecture. It contains the displaced
charge, which is linearly coupled to an oscillating electric field. So
we can rewrite the charge once again in terms of raising an lower
operators and arrive at the coupled Hamiltonian:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`\\begin{aligned}
\\hat{H} &= \\frac{\\omega_t}{2}\\hat{\\sigma}_z+\\Omega V_d(t)\\hat{\\sigma}_y\\end{aligned}`})}),`
`,(0,t.jsx)(n.p,{children:`All the other discussions are equivalent to our discussion on the ion
and any other single qubit system.`}),`
`,(0,t.jsx)(n.h2,{children:`Generating entanglement`}),`
`,(0,t.jsx)(n.p,{children:`Having identified the qubit, we can now also implement the entanglement
gate to build the universal quantum computer. Different options exist:`}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsxs)(n.li,{children:[`
`,(0,t.jsxs)(n.p,{children:[`The qubit island could be coupled through a mutual capacitance, such
that `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\hat{H}_{int}= C_g V_1 V_2`}),`.`]}),`
`]}),`
`,(0,t.jsxs)(n.li,{children:[`
`,(0,t.jsxs)(n.p,{children:[`The qubit island could be coupled through a mututal inductance, such that `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\hat{H}_{int}= M_{12} I_1 I_2`}),`.`]}),`
`]}),`
`]}),`
`,(0,t.jsxs)(n.p,{children:[`Typically the inductive coupling is chosen in a regime of very small
coupling `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`C_g \\ll C_1, C_2`}),`, where the `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`C_i`}),` describe the transmon
qubits. The full Hamiltonian reads then:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`\\begin{aligned}
\\hat{H} &=\\hat{H}_{T,1}+\\hat{H}_{T,2}+4e^2\\frac{C_g}{C_1C_2}n_1n_2\\end{aligned}`})}),`
`,(0,t.jsxs)(n.p,{children:[`we identified here `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`V_i = \\frac{2e}{C_i}n_i`}),`. We can now further rewrite
the occupation in terms of raising and lowering operators
`,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`n\\propto i(a-a^\\dagger)`}),`, which is can be expressed as a Pauli matrix for
the buttom manifold. So we actually have the coupling:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`\\begin{aligned}
\\hat{H} &=\\hat{H}_{T,1}+\\hat{H}_{T,2}+g\\sigma_{y,1}\\sigma_{y,2}\\end{aligned}`})}),`
`,(0,t.jsx)(n.p,{children:`While this basic operating principle of capacitive coupling is indeed
widely used, it is worth to read the fine-print as the different actual
implementation can to different 2-Qubit gates:`}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsxs)(n.li,{children:[`
`,(0,t.jsxs)(n.p,{children:[`The `,(0,t.jsx)(n.strong,{children:`iSWAP`}),` gate is the implementation of the `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\sigma_y \\sigma_y`}),`
coupling.`]}),`
`]}),`
`,(0,t.jsxs)(n.li,{children:[`
`,(0,t.jsxs)(n.p,{children:[`The `,(0,t.jsx)(n.strong,{children:`phase`}),` gate, shows very high fidelities, but makes it necessary to tune the freuqency of the qubit. It implements a `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\sigma_z \\sigma_z`}),`-coupling on the spins. Fidelities of > 99% were demonstrated for this gate `,(0,t.jsx)(n.a,{href:`https://doi.org/10.1038/nature13171`,children:`(Barends et al., 2014)`}),`.`]}),`
`]}),`
`,(0,t.jsxs)(n.li,{children:[`
`,(0,t.jsxs)(n.p,{children:[`The `,(0,t.jsx)(n.strong,{children:`cross-resonance`}),` (CR) gate is only controlled through
microwaves. It implements the a `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\sigma_x \\sigma_z`}),`-coupling on the
spins. This is gate employed by IBM `,(0,t.jsx)(n.a,{href:`https://doi.org/10.1103/physrevlett.107.080502`,children:`(Chow et al., 2011)`}),`.`]}),`
`]}),`
`]}),`
`,(0,t.jsx)(n.h2,{children:`A CNOT gate constructed from the physical entangling gates`}),`
`,(0,t.jsx)(n.p,{children:`We would now like to discuss how we can use the capacitive coupling to
implement a CNOT gates. This discussion is closely related to the
possibility of using a Soerensen-Molmer gate, discussed in lecture 2, to
implement a CNOT gate.`}),`
`,(0,t.jsxs)(n.p,{children:[`The `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\sigma_y \\sigma_y`}),` coupling for the right amount of leads to a
coupling matrix:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`\\begin{aligned}
iSWAP &= \\left(\\begin{array}{cccc}
1 & 0 & 0 & 0\\\\
0 & 0 &-i & 0\\\\
0 & -i & 0 & 0\\\\
0 & 0 & 0 & 1
\\end{array}\\right)\\end{aligned}`})}),`
`,(0,t.jsx)(n.p,{children:`The iSWAP can then be used to
represent the CNOT gate.`}),`
`,(0,t.jsxs)(n.p,{children:[`So we will focus shortly on the current limitations of qubit systems.
Please be aware that this is a rapidly evolving field, so most likely
the paragraph will be outdated within a few months. One good summary can
be found in `,(0,t.jsx)(n.a,{href:`https://doi.org/10.1073/pnas.1618020114`,children:`(Linke et al., 2017)`}),` and written by an ion trapping group.`]}),`
`,(0,t.jsx)(n.h2,{children:`Summmary`}),`
`,(0,t.jsx)(n.p,{children:`In this tutorial, we discussed how the two level system is implemented in superconducting devices and how they are coupled. This should give you a basic feeling for this widely used hardware platform and its limitations.`})]})}function i(e={}){let{wrapper:n}=e.components||{};return n?(0,t.jsx)(n,{...e,children:(0,t.jsx)(r,{...e})}):r(e)}export{i as default,n as frontmatter};