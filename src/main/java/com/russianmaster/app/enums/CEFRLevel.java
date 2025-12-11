package com.russianmaster.app.enums;

public enum CEFRLevel {
    // Level(Weight, Description)
    A1(1, "Beginner"),
    A2(2, "Elementary"),
    B1(3, "Intermediate"),
    B2(4, "Upper Intermediate"),
    C1(5, "Advanced"),
    C2(6, "Mastery");

    private final int weight;
    private final String description;

    CEFRLevel(int weight, String description) {
        this.weight = weight;
        this.description = description;
    }

    public int getWeight() { return weight; }
}