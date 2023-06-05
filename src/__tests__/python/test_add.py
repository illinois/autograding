from add import add

def test_add_zeros():
    assert add(0, 0) == 0

def test_failing_add_zeros():
    assert add(0, 0) == 1

def test_one_plus_zero():
    assert add(1, 0) == 1

def test_failing_one_plus_zero():
    assert add(1, 0) == 2

def test_two_plus_two():
    assert add(2, 2) == 4

def test_failing_two_plus_two():
    assert add(2, 2) == 22
