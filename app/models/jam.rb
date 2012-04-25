class Jam < ActiveRecord::Base
  attr_accessible :song, :title
  validates :title, :song, presence: true
end
