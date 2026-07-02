import pickle
from src.engine.mock_model import MockModel, MockExplainer

if __name__ == "__main__":
    with open('models/champion_model_calibrated.pkl', 'wb') as f:
        pickle.dump(MockModel(), f)

    with open('models/shap_explainer.pkl', 'wb') as f:
        pickle.dump(MockExplainer(), f)
