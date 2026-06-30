import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import (
    roc_curve,
    precision_recall_curve,
    confusion_matrix,
    ConfusionMatrixDisplay,
)
import shap
import numpy as np


def plot_business_cost_curve(costs_df, optimal_threshold, save_path=None):
    """Plots the Threshold vs. Expected Business Cost curve."""
    plt.figure(figsize=(10, 6))
    plt.plot(
        costs_df["Threshold"],
        costs_df["Total_Business_Cost"],
        label="Total Expected Cost",
        color="red",
    )
    plt.axvline(
        optimal_threshold,
        color="blue",
        linestyle="--",
        label=f"Optimal Threshold ({optimal_threshold:.2f})",
    )
    plt.title("Threshold Sensitivity Analysis vs Business Cost")
    plt.xlabel("Probability Threshold")
    plt.ylabel("Expected Cost ($)")
    plt.legend()
    plt.grid(True, alpha=0.3)
    if save_path:
        plt.savefig(save_path, bbox_inches="tight")
        plt.close()
    else:
        plt.show()


def plot_roc_curve(y_true, y_probs, roc_auc, save_path=None):
    """Plots the standard ROC Curve."""
    fpr, tpr, _ = roc_curve(y_true, y_probs)
    plt.figure()
    plt.plot(fpr, tpr, label=f"ROC (AUC = {roc_auc:.3f})", color="darkorange")
    plt.plot([0, 1], [0, 1], linestyle="--", color="gray")
    plt.xlabel("False Positive Rate")
    plt.ylabel("True Positive Rate")
    plt.title("ROC Curve")
    plt.legend()
    if save_path:
        plt.savefig(save_path, bbox_inches="tight")
        plt.close()
    else:
        plt.show()


def plot_pr_curve(y_true, y_probs, pr_auc, save_path=None):
    """Plots the Precision-Recall Curve."""
    prec_curve, rec_curve, _ = precision_recall_curve(y_true, y_probs)
    plt.figure()
    plt.plot(rec_curve, prec_curve, label=f"PR-AUC = {pr_auc:.3f}", color="indigo")
    plt.xlabel("Recall")
    plt.ylabel("Precision")
    plt.title("Precision-Recall Curve")
    plt.legend()
    if save_path:
        plt.savefig(save_path, bbox_inches="tight")
        plt.close()
    else:
        plt.show()


def plot_confusion_matrix(y_true, y_preds, threshold, save_path=None):
    """Plots the Confusion Matrix with a specific threshold in the title."""
    cm = confusion_matrix(y_true, y_preds)
    disp = ConfusionMatrixDisplay(
        confusion_matrix=cm, display_labels=["Legitimate", "Fraud"]
    )
    fig, ax = plt.subplots(figsize=(6, 5))
    disp.plot(cmap="Blues", ax=ax)
    plt.title(f"Confusion Matrix (Threshold={threshold:.2f})")
    if save_path:
        plt.savefig(save_path, bbox_inches="tight")
        plt.close()
    else:
        plt.show()


def generate_shap_summary(explainer, X_sample, save_path=None):
    """Generates and saves the SHAP summary plot."""
    shap_values = explainer.shap_values(X_sample)
    plt.figure()
    if isinstance(shap_values, list):
        shap.summary_plot(shap_values[1], X_sample, show=False)
    elif len(np.array(shap_values).shape) == 3:
        shap.summary_plot(shap_values[:, :, 1], X_sample, show=False)
    else:
        shap.summary_plot(shap_values, X_sample, show=False)

    if save_path:
        plt.savefig(save_path, bbox_inches="tight")
        plt.close()
    else:
        plt.show()
