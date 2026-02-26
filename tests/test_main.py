import main


def test_main_has_start_app():
    assert hasattr(main, "start_app")
    assert callable(main.start_app)
