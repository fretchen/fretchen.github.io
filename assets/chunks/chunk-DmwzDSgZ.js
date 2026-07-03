import{On as e}from"./chunk-DpnvOa7p.js";var t=e(),n={author:[`fretchen`],order:1,title:`Tutorial 1 - The qubit or the two level system`};function r(e){let n={code:`code`,em:`em`,h2:`h2`,img:`img`,li:`li`,p:`p`,pre:`pre`,ul:`ul`,...e.components};return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(n.p,{children:`In this first tutorial we are going to discuss the two-level system as it is the simplest unit of quantum computing systems. We discuss on a physics level with Hamiltonians etc its static properties like level splitting and avoided crossings. Then we discuss dynamical processes like Rabi oscillations and their connection to the notation of quantum computation.`}),`
`,(0,t.jsx)(n.p,{children:`This lays the basis for the discussion of quantum computation hardware in the next tutorials. Namely:`}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsx)(n.li,{children:`superconducting qubits`}),`
`,(0,t.jsx)(n.li,{children:`trapped ions`}),`
`,(0,t.jsx)(n.li,{children:`neutral atoms`}),`
`]}),`
`,(0,t.jsx)(n.h2,{children:`Hamiltonian, Eigenstates and Matrix Notation`}),`
`,(0,t.jsxs)(n.p,{children:[`To start out, we will consider two eigenstates `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`|0\\rangle,~|1\\rangle `}),` of the Hamiltonian `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\hat{H}_0`}),` with`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:` \\hat{H}_0|0\\rangle=E_0|0\\rangle, \\qquad \\hat{H}_0|1\\rangle=E_1|1\\rangle.`})}),`
`,(0,t.jsx)(n.p,{children:`Quite typically we might think of it as a two-level atom with states 0 and 1. The eigenstates can be expressed in matrix notation:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:` |0\\rangle=\\left( \\begin{array}{c} 1 \\\\ 0 \\end{array} \\right), \\qquad |1\\rangle=\\left( \\begin{array}{c} 0 \\\\ 1 \\end{array} \\right),`})}),`
`,(0,t.jsxs)(n.p,{children:[`so that `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\hat{H}_0`}),` be written as a diagonal matrix`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`    \\hat{H}_0 = \\left(\\begin{array}{cc} E_0 & 0 \\\\ 0 & E_1 \\end{array}\\right).`})}),`
`,(0,t.jsx)(n.p,{children:`If we would only prepare eigenstates the system would be rather boring. However, we typically have the ability to change the Hamiltonian by switching on and off laser or microwave fields. We can then write the Hamiltonian in its most general form as:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`\\hat{H} = \\frac{\\hbar}{2}\\left( \\begin{array}{cc} \\Delta  & \\Omega_x - i\\Omega_y\\\\ \\Omega_x +i\\Omega_y & -\\Delta \\end{array} \\right)`})}),`
`,(0,t.jsx)(n.p,{children:`Sometimes we will also chose the definition:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`\\Omega = |\\Omega| e^{i\\varphi}=\\Omega_x + i\\Omega_y`})}),`
`,(0,t.jsx)(n.p,{children:`It is particularly useful for the case in which the coupling is created by a laser. Another useful way of thinking about the two-level system is as a spin in a magnetic field. Let us remind us of the definitions of the of the spin-1/2 matrices:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`s_x = \\frac{\\hbar}{2}\\left(\\begin{array}{cc}
0 & 1\\\\
1 &  0
\\end{array}
\\right)~
s_y = \\frac{\\hbar}{2}\\left(\\begin{array}{cc}
0 & -i\\\\
i &  0
\\end{array}
\\right)~s_z =\\frac{\\hbar}{2} \\left(\\begin{array}{cc}
1 & 0\\\\
0 &  -1
\\end{array}
\\right)`})}),`
`,(0,t.jsx)(n.p,{children:`We then obtain:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`%\\label{Eq:HamSpin}
\\hat{H} = \\mathbf{B}\\cdot\\hat{\\mathbf{s}}\\text{ with }\\mathbf{B} = (\\Omega_x, \\Omega_y, \\Delta)`})}),`
`,(0,t.jsx)(n.p,{children:`You will go through this calculation in the excercise of this week.`}),`
`,(0,t.jsxs)(n.h2,{children:[`Case of no perturbation `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\Omega = 0`})]}),`
`,(0,t.jsxs)(n.p,{children:[`This is exactly the case of no applied laser fields that we discussed previously. We simply removed the energy offset `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`E_m = \\frac{E_0+E_1}{2}`}),` and pulled out the factor `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\hbar`}),`, such that `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\Delta`}),` measures a frequency. So we have:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`E_0 = E_m+ \\frac{\\hbar}{2}\\Delta\\\\
E_1 = E_m- \\frac{\\hbar}{2}\\Delta`})}),`
`,(0,t.jsxs)(n.p,{children:[`We typically call `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\Delta`}),` the energy difference between the levels or the `,(0,t.jsx)(n.em,{children:`detuning`}),`.`]}),`
`,(0,t.jsxs)(n.h2,{children:[`Case of no detuning `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\Delta = 0`})]}),`
`,(0,t.jsxs)(n.p,{children:[`Let us suppose that the diagonal elements are exactly zero. And for simplicity we will also keep `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\Omega_y =0`}),` as it simply complicates the calculations without adding much to the discussion at this stage. The Hamiltonian reads then:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`\\hat{H} = \\frac{\\hbar}{2}\\left( \\begin{array}{cc} 0  & \\Omega\\\\ \\Omega &0 \\end{array} \\right)`})}),`
`,(0,t.jsxs)(n.p,{children:[`Quite clearly the states `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\varphi_{1,2}`}),` are not the eigenstates of the system anymore. How should the system be described now ? We can once again diagonalize the system and write`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`\\hat{H}|\\varphi_{\\pm}\\rangle = E_{\\pm}|\\varphi_{\\pm}\\rangle\\\\
E_{\\pm} = \\pm\\frac{\\hbar}{2}\\Omega\\\\
|\\varphi_{\\pm}\\rangle = \\frac{|0\\rangle\\pm|1\\rangle}{\\sqrt{2}}`})}),`
`,(0,t.jsx)(n.p,{children:`Two important consequences can be understood from this result:`}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsxs)(n.li,{children:[`The coupling of the two states shifts their energy by `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\Omega`}),`. This is the idea of level repulsion.`]}),`
`,(0,t.jsx)(n.li,{children:`The coupled states are a superposition of the initial states.`}),`
`]}),`
`,(0,t.jsxs)(n.p,{children:[`This is also a motivation the formulation of the 'bare' system for `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\Omega = 0`}),` and the 'dressed' states for the coupled system.`]}),`
`,(0,t.jsx)(n.h2,{children:`General case`}),`
`,(0,t.jsx)(n.p,{children:`Quite importantly we can solve the system completely even in the general case. By diagonalizing the Hamiltonian we obtain:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:` E_\\pm = \\pm \\frac{\\hbar}{2} \\sqrt{\\Delta^2+|\\Omega|^2}`})}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-python`,children:`import matplotlib.pyplot as plt
import numpy as np

deltaMax = 5
delta = np.linspace(-deltaMax, deltaMax, 100)
omega = 1

Eplus = np.sqrt(delta**2+omega**2)/2
Eminus = -np.sqrt(delta**2+omega**2)/2

f, ax = plt.subplots()
ax.plot(delta, Eplus, label="$E_+$")
ax.plot(delta, Eminus, label="$E_+$")
ax.legend()
ax.set_xlabel("detuning $\\Delta$")
ax.set_ylabel("energy $E$");
`})}),`
`,(0,t.jsx)(n.p,{children:(0,t.jsx)(n.img,{src:`quantum_hardware_101_3_0.png`,alt:`png`})}),`
`,(0,t.jsx)(n.p,{children:`The Eigenstates then read:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`|\\psi_+\\rangle =\\cos\\left(\\frac{\\theta}{2}\\right) e^{-i{\\varphi}/{2}}|0\\rangle+\\sin\\left(\\frac{\\theta}{2}\\right) e^{i{\\varphi}/{2}}|1\\rangle`})}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`|\\psi_-\\rangle =-\\sin\\left(\\frac{\\theta}{2}\\right)e^{-i{\\varphi}/{2}}|0\\rangle+\\cos\\left(\\frac{\\theta}{2}\\right) e^{i{\\varphi}/{2}}|1\\rangle`})}),`
`,(0,t.jsx)(n.p,{children:`where`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`\\tan(\\theta) = \\frac{|\\Omega|}{\\Delta}`})}),`
`,(0,t.jsx)(n.h2,{children:`Dynamical Aspects`}),`
`,(0,t.jsxs)(n.p,{children:[`After the static case we now want to investigate the dynamical properties of the two-state system. We calculate the time evolution of `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`|\\psi(t)\\rangle = c_0(t)|0\\rangle + c_1(t)|1\\rangle`}),` with the Schrödinger equation and the perturbed Hamiltonian :`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`i\\hbar \\frac{d}{dt}|\\psi(t)\\rangle=\\hat{H}|\\psi(t)\\rangle,`})}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`i \\frac{d}{dt}\\left(\\begin{array}{c} c_0(t) \\\\ c_1(t) \\end{array}\\right) = \\frac{1}{2}\\left( \\begin{array}{cc} \\Delta & \\Omega \\\\ \\Omega^* & -\\Delta \\end{array} \\right) \\left(\\begin{array}{c} c_0(t) \\\\ c_1(t) \\end{array} \\right).`})}),`
`,(0,t.jsxs)(n.p,{children:[`We have two coupled differential equations and we luckily already know how to solve them as we have calculated the two eigenenergies in the previous section. For the state `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`|\\psi(t)\\rangle`}),` we get`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:` |\\psi(t)\\rangle=\\lambda e^{-i{E_+}t/{\\hbar}} |\\psi_+\\rangle + \\mu e^{-i{E_-}t/{\\hbar}} |\\psi_-\\rangle`})}),`
`,(0,t.jsxs)(n.p,{children:[`with the factors `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\lambda`}),` and `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\mu`}),`, which are defined by the initial state. The most common question is then what happens to the system if we start out in the bare state `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`|0\\rangle`}),` and then let it evolve under coupling with a laser ? So what is the probability to find it in the other state `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`|1\\rangle`}),`:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`P_1(t)=\\left|\\langle 1|\\psi(t)\\rangle\\right|^2.`})}),`
`,(0,t.jsxs)(n.p,{children:[`As a first step, we have to apply the initial condition and express `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`|\\psi(0)\\rangle`}),` in terms of `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`|\\psi_{\\pm}\\rangle`}),`:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`|\\psi(0)\\rangle \\overset{!}{=} |0\\rangle`})}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`  =  e^{i{\\varphi}/{2}} \\left[ \\cos\\left( \\frac{\\theta}{2}\\right) |\\psi_{+}\\rangle-\\sin\\left(\\frac{\\theta}{2}\\right)|\\psi_{-}\\rangle\\right]`})}),`
`,(0,t.jsxs)(n.p,{children:[`By equating the coefficients we get for `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\lambda`}),` and `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\mu`}),`:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`\\lambda = e^{i{\\varphi}/{2}}\\cos\\left(\\frac{\\theta}{2}\\right), \\qquad  \\mu = -e^{i{\\varphi}/{2}}\\sin\\left(\\frac{\\theta}{2}\\right).`})}),`
`,(0,t.jsx)(n.p,{children:`One thus gets:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:` P_1(t)= \\left|e^{i\\varphi} \\sin\\left(\\frac{\\theta}{2}\\right)\\cos\\left(\\frac{\\theta}{2}\\right)\\left[e^{-i{E_+}t/{\\hbar}} - e^{-i{E_-}t/{\\hbar}}\\right]\\right|^2`})}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`= \\sin^2(\\theta)\\sin^2\\left(\\frac{E_+-E_-}{2\\hbar}t\\right)`})}),`
`,(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`P_1(t)`}),` can be expressed with `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\Delta`}),` and `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\Omega`}),` alone. The obtained relation is called Rabi's formula:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:` P_1(t)=\\frac{1}{1+\\left(\\frac{\\Delta}{|\\Omega|}\\right)^2}\\sin^2\\left(\\sqrt{|\\Omega|^2+\\Delta^2}\\frac{t}{2}\\right)`})}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-python`,children:`def rabi_osc(time: float, omega: float, delta: float) -> float:
  """
  time evolution in the Rabi oscillation

  Args:
    time: time at which we measure
    omega: coupling strength
    delta: detuning

  Returns:
    float: probability to be in the excited state
  """
  return 1/(1+(delta/omega)**2)*np.sin(np.sqrt(omega**2+delta**2)*time/2)**2


omega = 2*np.pi*1
time = np.linspace(0,2, 100)



delta = 0

f, ax = plt.subplots()
ax.plot(time, rabi_osc(time, omega, 0), label = "$\\Delta = 0$")
ax.plot(time, rabi_osc(time, omega, omega), label = "$\\Delta = \\Omega$")
ax.plot(time, rabi_osc(time, omega, 10*omega), label = "$\\Delta = 10\\cdot\\Omega$")
ax.legend()
ax.set_xlabel("time $t$")
ax.set_ylabel("probability $P_1$")
`})}),`
`,(0,t.jsxs)(n.p,{children:[`Text(0, 0.5, 'probability `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`P_1`}),`')`]}),`
`,(0,t.jsx)(n.p,{children:(0,t.jsx)(n.img,{src:`quantum_hardware_101_6_1.png`,alt:`png`})}),`
`,(0,t.jsx)(n.p,{children:`A few key words concerning Rabi oscillations are in order:`}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsx)(n.li,{children:`The probability to be in the excited state is indeed maximal if there is zero detuning.`}),`
`,(0,t.jsxs)(n.li,{children:[`The speed of the oscillations get higher with higher detuning. This fact is often overlooked at first sight but key in approximations like the `,(0,t.jsx)(n.em,{children:`rotating wave approximation`}),`.`]}),`
`]}),`
`,(0,t.jsx)(n.h2,{children:`A few words on the quantum information notation`}),`
`,(0,t.jsx)(n.p,{children:`The qubit is THE basic ingredient of quantum computers. However, you will typically not find Pauli matrices and other common notations of two-state systems in the platforms. The typical notation there is:`}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`R_x(\\phi)`}),` is a rotation around the x-axis for an angle `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\phi`}),`.`]}),`
`,(0,t.jsxs)(n.li,{children:[`Same holds for `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`R_y`}),` and `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`R_z`}),`.`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`X`}),` denotes the rotation around the x axis for an angle `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\pi`}),`. So it transforms `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`|1\\rangle`}),` into `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`|0\\rangle`}),` and vise versa.`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`Z`}),` denotes the rotation around the x axis for an angle `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`\\pi`}),`. So it transforms `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`|+\\rangle`}),` into `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`|-\\rangle`}),` and vise versa.`]}),`
`]}),`
`,(0,t.jsxs)(n.p,{children:[`The most commonly used gate is actually one that we did not talk about at all, it is the Hadamard gate, which transforms `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`|1\\rangle`}),` into `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`|-\\rangle`}),` and `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`|0\\rangle`}),` into `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`|+\\rangle`}),`:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`\\hat{H}|1\\rangle = |-\\rangle`})}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`\\hat{H}|0\\rangle = |+\\rangle`})}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`\\hat{H}|-\\rangle = |1\\rangle`})}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`\\hat{H}|+\\rangle = |0\\rangle`})}),`
`,(0,t.jsx)(n.p,{children:`In the next tutorial we will see how these concepts are implemented in real hardware.`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-python`})})]})}function i(e={}){let{wrapper:n}=e.components||{};return n?(0,t.jsx)(n,{...e,children:(0,t.jsx)(r,{...e})}):r(e)}export{i as default,n as frontmatter};