import{Cn as e}from"./chunk-YPwviyFJ.js";var t=e(),n={author:[`fretchen`],order:0,title:`QML 001 - A summary of classical supervised learning`};function r(e){let n={a:`a`,code:`code`,em:`em`,h2:`h2`,img:`img`,li:`li`,p:`p`,pre:`pre`,ul:`ul`,...e.components};return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(n.p,{children:`In this tutorial, we will discuss some basic ideas behind classical supervised learning before we jump into the quantum part.`}),`
`,(0,t.jsx)(n.p,{children:`The notebook is structured as follows:`}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsxs)(n.li,{children:[`We introduce the learning task of classifying data points `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`x_i`}),` with labels `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`y_i`})]}),`
`,(0,t.jsx)(n.li,{children:`We introduce simple classification through logistic regression with bias and weight.`}),`
`,(0,t.jsx)(n.li,{children:`We provide simple training`}),`
`,(0,t.jsx)(n.li,{children:`We test the performance of the circuit.`}),`
`]}),`
`,(0,t.jsxs)(n.p,{children:[`We will always focus on simplicity throughout this tutorial and leave the more complex discussions to the extensive literature. So readers thank think "yet another tutorial on logistic regression", can most likely directly jump to the very `,(0,t.jsx)(n.a,{href:`qml101`,children:`first tutorial`}),` on quantum machine learning.`]}),`
`,(0,t.jsx)(n.h2,{children:`A simple learning task`}),`
`,(0,t.jsx)(n.p,{children:`For simplicity we will start out with a simple problem, where each data set has only a single variable and extend it later to higher dimensional data sets.`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-python`,children:`from typing import Union, List

import numpy as np
import matplotlib.pyplot as plt

from tqdm import tqdm

`})}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-python`,children:`np.random.seed(1)
x = np.random.uniform(-np.pi, np.pi, 100)
y = 1.0* (x <  1)

f, ax = plt.subplots()
ax.plot(x, y, "o")
ax.set_xlabel(r"input value $x_i$");
ax.set_ylabel(r"label $y_i$");
`})}),`
`,(0,t.jsx)(n.p,{children:(0,t.jsx)(n.img,{src:`./qml_001_3_0.png`,alt:`png`})}),`
`,(0,t.jsxs)(n.p,{children:[`The learning task is now to predict the label `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`y_i`}),` from the input value `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`x_i`}),`. To get started we have to divide the data set into a training part and a test part:`]}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsxs)(n.li,{children:[`On the `,(0,t.jsx)(n.em,{children:`training set`}),` we will optimize the algorithm to achieve the highest possible accuracy in predicting the label.`]}),`
`,(0,t.jsxs)(n.li,{children:[`On the `,(0,t.jsx)(n.em,{children:`test set`}),` we will test the performance of the algorithm with data it has never seen.`]}),`
`]}),`
`,(0,t.jsx)(n.p,{children:`The usual problem is here to find a good balance between a sufficient amount of training data, yet leaving enough test data to have a statistically significant test.`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-python`,children:`from sklearn.model_selection import train_test_split
`})}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-python`,children:`x_train, x_test, y_train, y_test = train_test_split(
    x, y, test_size=0.20, random_state=42
)

f, (ax1, ax2) = plt.subplots(1, 2, figsize=(15, 5), sharex=True, sharey=True)
ax1.plot(x_train, y_train, "o")
ax1.set_xlabel("input value")
ax1.set_ylabel(" given labels")
ax1.set_title("training data")

ax2.plot(x_test, y_test, "o")
ax2.set_xlabel("input value")
ax2.set_title("test data")
`})}),`
`,(0,t.jsx)(n.p,{children:`Text(0.5, 1.0, 'test data')`}),`
`,(0,t.jsx)(n.p,{children:(0,t.jsx)(n.img,{src:`./qml_001_6_1.png`,alt:`png`})}),`
`,(0,t.jsx)(n.h2,{children:`Logistice regression as a minimal algorithm`}),`
`,(0,t.jsxs)(n.p,{children:[`It is now time to set up the algorithm for the training. We will use `,(0,t.jsx)(n.a,{href:`https://en.wikipedia.org/wiki/Logistic_regression`,children:`logistic regression`}),`, despite the fact that this horse has been ridden to death. It is has just all the right ingredients that are necessary to agree on basic concepts and notations. The logistic function itself is defined as:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-math math-display`,children:`p(x) = \\frac{1}{1+e^{-(W\\cdot x+b)}}`})}),`
`,(0,t.jsx)(n.p,{children:`It has a number of useful properties for us:`}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsx)(n.li,{children:`It interpolates nicely between 0 and 1.`}),`
`,(0,t.jsxs)(n.li,{children:[`The value of the transition is set by the `,(0,t.jsx)(n.em,{children:`bias`}),` `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`b`}),`. For `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`x \\gg b`}),` the exponential goes to zero and `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`p(x) \\rightarrow 1`}),`, while it goes to 0 for the other side.`]}),`
`,(0,t.jsxs)(n.li,{children:[`The sharpness of the transition is set by the weight `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`W`}),`, which tells us how much of an influence we should attach to the input value `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`x`}),`.`]}),`
`]}),`
`,(0,t.jsx)(n.p,{children:`Below you can find a general example of such a logistic regression.`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-python`,children:`weight = 3
bias = 1

y_log = 1/(1+np.exp(-(weight*x+bias)))
f, ax = plt.subplots()
ax.plot(x, y_log, 'o')
ax.set_xlabel('x_i')
ax.set_ylabel('p(x)')
ax.set_title("logistic regression");
`})}),`
`,(0,t.jsx)(n.p,{children:(0,t.jsx)(n.img,{src:`./qml_001_8_0.png`,alt:`png`})}),`
`,(0,t.jsxs)(n.p,{children:[`We can use this logistic regression for labelling, but simply deciding that the label is 0, if `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`p(x) <\\frac{1}{2}`}),` and and 1 if `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`p(x) > \\frac{1}{2}`}),`.`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-python`,children:`def get_accuracy(weight: float, bias: float, xvals: List[float], yvals: List[int]
) -> Union[float, List[int]]:
    """
    Calculates the accuracy of the logistic regression for a given set of data.

    Args:
      weight: the training parameter for the weight
      bias: the training parameter for the bias
      xvals: the input values
      yvals: the labels
    Returns:
      The accuracy and the predicted labels.
    """
    pred_labels = np.zeros(len(xvals))
    accurate_prediction = 0
    for ii, xinput, yinput in zip(range(len(xvals)), xvals, yvals.astype(int)):
        # set the circuit parameter
        y_log = 1/(1+np.exp(-(weight*xinput+bias)))
        pred_label = 1.0*(y_log>1/2)
        pred_labels[ii] = pred_label
        if yinput == pred_label:
            accurate_prediction += 1
    return accurate_prediction / len(yvals), pred_labels
`})}),`
`,(0,t.jsx)(n.p,{children:`And now we can have a look at the labeling with some randomly guessed initial values.`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-python`,children:`weight = -0.8
bias = 0
accuracy, y_pred = get_accuracy(bias = bias, weight=weight, xvals=x_train, yvals=y_train)

false_label = abs(y_pred - y_train) > 0

x_false = x_train[false_label]
y_false = y_pred[false_label]

print(f"The circuit has an accuracy of {accuracy}")
f, ax = plt.subplots()
ax.plot(x_train, y_pred, "o", label="predicted label")
ax.plot(x_false, y_false, "ro", label="false label")
ax.legend()
`})}),`
`,(0,t.jsx)(n.p,{children:`The circuit has an accuracy of 0.85`}),`
`,(0,t.jsx)(n.p,{children:(0,t.jsx)(n.img,{src:`./qml_001_12_2.png`,alt:`png`})}),`
`,(0,t.jsx)(n.p,{children:`As we can see above there is quite a regime, where the model does to predict the labels very well. This can be improved by training the model parameters systematically.`}),`
`,(0,t.jsx)(n.h2,{children:`Training the minimalistic algorithm`}),`
`,(0,t.jsxs)(n.p,{children:[`To improve the performance of the circuit, we have to train it. This basically involves the minimization of some loss function as a function of the circuit parameters `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`W`}),` and `,(0,t.jsx)(n.code,{className:`language-math math-inline`,children:`b`}),`. In this example, we can simply calculate the accuracy of the circuit as a function of the bias and obtain its minimimum.`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-python`,children:`weight = -1

Nbias = 101
biases = np.linspace(-2, 2, Nbias)
accuracies = np.zeros(Nbias)

for ii, bias_val in enumerate(tqdm(biases)):
    accuracy, y_pred = get_accuracy(bias = bias_val, weight=weight, xvals=x_train, yvals=y_train)
    accuracies[ii] = accuracy
`})}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-python`,children:`opt_bias = biases[accuracies.argmax()]

f, ax = plt.subplots()
ax.plot(biases, accuracies)
ax.axvline(opt_bias, color="C1", label="optimal bias")
ax.set_ylabel("accuracy")
ax.set_xlabel("biases")
ax.legend()
`})}),`
`,(0,t.jsx)(n.p,{children:(0,t.jsx)(n.img,{src:`./qml_001_16_1.png`,alt:`png`})}),`
`,(0,t.jsx)(n.p,{children:`We clearly identify a optimal value for the bias at which the accuracy is maximal. This allows to test the accuracy on the optimal value of the weights again to obtain.`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-python`,children:`accuracy, y_pred = get_accuracy(bias = opt_bias , weight= weight, xvals=x_train, yvals=y_train)

false_label = abs(y_pred - y_train) > 0

x_false = x_train[false_label]
y_false = y_pred[false_label]

f, ax = plt.subplots()
ax.plot(x_train, y_pred, "o", label="predicted label")
ax.plot(x_false, y_false, "ro", label="false label")
ax.legend()


print(f"The trained circuit has an accuracy of {accuracy:.2}")
`})}),`
`,(0,t.jsx)(n.p,{children:`The trained circuit has an accuracy of 1.0`}),`
`,(0,t.jsx)(n.p,{children:(0,t.jsx)(n.img,{src:`./qml_001_18_1.png`,alt:`png`})}),`
`,(0,t.jsx)(n.h2,{children:`Testing the algorithm`}),`
`,(0,t.jsx)(n.p,{children:`Having finished the training, we can test the circuit now on data points that it has never seen.`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-python`,children:`test_accuracy, y_test_pred = get_accuracy(
    bias = opt_bias, weight=weight, xvals=x_test, yvals=y_test
)

false_label = abs(y_test_pred - y_test) > 0

x_false = x_test[false_label]
y_false = y_test_pred[false_label]

print(f"The circuit has a test accuracy of {test_accuracy:.2}")
f, ax = plt.subplots()
ax.plot(x_test, y_test_pred, "o", label="predicted label")
ax.plot(x_false, y_false, "ro", label="false label")
ax.legend();
`})}),`
`,(0,t.jsx)(n.p,{children:`The circuit has a test accuracy of 1.0`}),`
`,(0,t.jsx)(n.p,{children:(0,t.jsx)(n.img,{src:`./qml_001_20_1.png`,alt:`png`})}),`
`,(0,t.jsx)(n.h2,{children:`Summary of classical supervised learning`}),`
`,(0,t.jsx)(n.p,{children:`In this tutorial, we studied some basic concepts like training and classification for an extremely simple case. We saw:`}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsx)(n.li,{children:`the existence of a classification algorithm.`}),`
`,(0,t.jsx)(n.li,{children:`How it relates input and output label.`}),`
`,(0,t.jsx)(n.li,{children:`How it is trained.`}),`
`,(0,t.jsx)(n.li,{children:`How it is tested on test data.`}),`
`]}),`
`,(0,t.jsxs)(n.p,{children:[`In the `,(0,t.jsx)(n.a,{href:`https://colab.research.google.com/drive/1XMkIBrU1lBLTT-oVufVTifHivss0HDI1?usp=sharing`,children:`first tutorial on QML`}),`, we will see how this translate in the simplest fashion to quantum algorithms.`]})]})}function i(e={}){let{wrapper:n}=e.components||{};return n?(0,t.jsx)(n,{...e,children:(0,t.jsx)(r,{...e})}):r(e)}export{i as default,n as frontmatter};