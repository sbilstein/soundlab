class JamsController < ApplicationController
  # GET /jams
  # GET /jams.json
  def index
    @jams = Jam.all

    respond_to do |format|
      format.html # index.html.erb
      format.json { render json: @jams }
    end
  end

  # GET /jams/1
  # GET /jams/1.json
  def show
    @jam = Jam.find(params[:id])

    respond_to do |format|
      format.html # show.html.erb
      format.json { render json: @jam }
    end
  end

  # GET /jams/new
  # GET /jams/new.json
  def new
    @jam = Jam.new

    respond_to do |format|
      format.html # new.html.erb
      format.json { render json: @jam }
    end
  end

  # GET /jams/1/edit
  def edit
    @jam = Jam.find(params[:id])
  end

  # POST /jams
  # POST /jams.json
  def create
    @jam = Jam.new(params[:jam])

    respond_to do |format|
      if @jam.save
        format.html { redirect_to @jam, notice: 'Jam was successfully created.' }
        format.json { render json: @jam, status: :created, location: @jam }
      else
        format.html { render action: "new" }
        format.json { render json: @jam.errors, status: :unprocessable_entity }
      end
    end
  end

  # PUT /jams/1
  # PUT /jams/1.json
  def update
    @jam = Jam.find(params[:id])

    respond_to do |format|
      if @jam.update_attributes(params[:jam])
        format.html { redirect_to @jam, notice: 'Jam was successfully updated.' }
        format.json { head :no_content }
      else
        format.html { render action: "edit" }
        format.json { render json: @jam.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /jams/1
  # DELETE /jams/1.json
  def destroy
    @jam = Jam.find(params[:id])
    @jam.destroy

    respond_to do |format|
      format.html { redirect_to jams_url }
      format.json { head :no_content }
    end
  end
end
