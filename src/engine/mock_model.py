import numpy as np

class MockModel:
    def predict_proba(self, df):
        return np.array([[0.1, 0.9]])

class MockExplainer:
    def shap_values(self, df):
        return [np.zeros((1, df.shape[1])), np.zeros((1, df.shape[1]))]
